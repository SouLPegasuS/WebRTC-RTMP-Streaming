const express = require('express');
const { Worker } = require('mediasoup');
const { spawn } = require('child_process');

const app = express();
const httpServer = require('http').createServer(app);

const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'http://localhost:3000', // Adjust this based on your client's origin
    methods: ['GET', 'POST'],
  },
});

let worker;
let router;
let ffmpegProcess; // Variable to store the ffmpeg child process

(async () => {
  worker = await Worker.create({ logLevel: 'warn' });
  router = await worker.createRouter({ mediaCodecs: [{ kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 }, { kind: 'video', mimeType: 'video/h264', clockRate: 90000 }] });
})();

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Client connected');

  let producer;
  let consumer;

  socket.on('start', async () => {
    producer = await router.createProducer({ kind: 'video', rtpParameters: await router.createRtpParameters('video'), appData: { peerName: 'producer' } });
    consumer = await router.createConsumer({ producerId: producer.id, rtpCapabilities: await router.rtpCapabilities, paused: false, appData: { peerName: 'consumer' } });

    consumer.on('transportclose', () => {
      console.log('Consumer transport closed');
    });

    consumer.on('producerclose', () => {
      console.log('Consumer producer closed');
    });

    consumer.transport.on('close', () => {
      console.log('Consumer transport closed');
    });

    socket.emit('consumerParameters', { producerId: producer.id, id: consumer.id, kind: consumer.kind, rtpParameters: consumer.rtpParameters });

    // Start the ffmpeg process to encode and forward the stream to RTMP server
    startFfmpeg();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (producer) producer.close();
    if (consumer) consumer.close();
    // Stop the ffmpeg process when the client disconnects
    stopFfmpeg();
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Function to start the ffmpeg process
function startFfmpeg() {
  const ffmpegArgs = [
    '-hide_banner',
    '-f', 'rawvideo',
    '-pixel_format', 'yuv420p',
    '-video_size', '640x480', // Adjust based on your video size
    '-framerate', '30',
    '-i', 'pipe:0', // Input from pipe
    '-f', 'lavfi',
    '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', // Silent audio input
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '30',
    '-b:v', '3000k', // Adjust the bitrate based on your requirements
    '-c:a', 'aac',
    '-strict', 'experimental',
    '-f', 'flv', 'rtmp://a.rtmp.youtube.com/live2/u4d0-2sdq-ez4t-grwk-3175', // Replace with your RTMP server and stream key
  ];

  ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  // Pipe the consumer's video data to the ffmpeg process
  consumer.pipe(ffmpegProcess.stdin);

  // Handle ffmpeg process events
  ffmpegProcess.on('close', (code, signal) => {
    console.log(`ffmpeg process closed with code ${code} and signal ${signal}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });
}

// Function to stop the ffmpeg process
function stopFfmpeg() {
  if (ffmpegProcess) {
    ffmpegProcess.kill();
    ffmpegProcess = null;
  }
}
