import ncmutils from './ncm-audio-recognize/lib.js'
import { AudioContext } from 'web-audio-api-cjs'
import { createServer } from 'node:http'
import { URL } from 'node:url'


const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Handle /api endpoint
  if (url.pathname === "/api") {
    try {
      // Read request body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const audio = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
      
      const audioBuffer = float32ToAudioBuffer(new AudioContext(), audio, 48000);
      const encoded = await ncmutils.rawEncode(audioBuffer, 0, 6, 0);
      const result = await ncmutils.recognize(encoded);
      
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, {
        "Content-Type": "text/plain",
      });
      res.end(String(err));
    }
  } else {
    res.writeHead(404, {
      "Content-Type": "text/plain",
    });
    res.end("Not Found");
  }
});

function float32ToAudioBuffer(ctx, float32, sampleRate) {
  const buffer = ctx.createBuffer(1, float32.length, sampleRate);
  buffer.getChannelData(0).set(float32);
  return buffer;
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
