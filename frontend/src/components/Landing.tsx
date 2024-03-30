import { useEffect, useRef, useState } from "react"

export const Landing = () => {
    let localStream;
    const videoRef = useRef<HTMLVideoElement>(null);

    let captureCamera = async () => {
    //    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
    }

    let captureDisplay = async () => {
    //    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        const stream = await window.navigator.mediaDevices.getDisplayMedia({
            video: {
                frameRate: 60
            },
            audio: true
        })
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
    }

    let captureOverlay = async () => {
    //    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';  // Accept any video format
        input.onchange = handleFileSelection as any;
        input.click();
    }

    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (file && videoRef.current) {
          const fileURL = URL.createObjectURL(file);
          videoRef.current.src = fileURL;
          videoRef.current.loop=true;
          videoRef.current.muted=true;
          videoRef.current.play();
          console.log(videoRef.current);
        } else {
          console.error('No file selected.');
        }
    };

    return( 
        <div>
            <div id="videos">
                <video className="video-player" id="user-1" ref={videoRef} autoPlay playsInline ></video>
            </div>
            <button onClick={captureCamera}>Capture Camera</button>

            <button onClick={captureDisplay}>Capture Display</button>

            <button onClick={captureOverlay}>Capture Overlay</button>
        </div>
    )
}