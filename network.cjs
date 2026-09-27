const { WebSocketServer, WebSocket } = require("ws");
const { randomBytes } = require("crypto");
const os = require("os");
class RoomTransport {
  constructor(emit) {
    this.emit = emit;
    this.peers = new Map();
    this.next = 1;
  }
  stop() {
    this.client?.close();
    this.client = null;
    for (const s of this.peers.values()) s.close();
    this.peers.clear();
    this.server?.close();
    this.server = null;
  }
  async host() {
    this.stop();
    const token = randomBytes(4).toString("hex");
    this.server = new WebSocketServer({ port: 0, maxPayload: 2e6 });
    await new Promise((resolve, reject) => {
      this.server.once("listening", resolve);
      this.server.once("error", reject);
    });
    this.server.on("connection", (s, req) => {
      if (req.url !== "/" + token || this.peers.size >= 5) {
        s.close(1008, "Invalid room or full");
        return;
      }
      const id = String(this.next++);
      this.peers.set(id, s);
      s.on("message", (raw) => {
        try {
          const data = JSON.parse(raw);
          if (["hello", "input", "action"].includes(data.type))
            this.emit({ ...data, peer: id });
        } catch {}
      });
      s.on("close", () => {
        this.peers.delete(id);
        this.emit({ type: "left", peer: id });
      });
      s.on("error", () => {});
    });
    const ips = Object.values(os.networkInterfaces())
      .flat()
      .filter((i) => i.family === "IPv4" && !i.internal)
      .map((i) => i.address);
    return {
      address:
        (ips[0] || "127.0.0.1") +
        ":" +
        this.server.address().port +
        "/" +
        token,
    };
  }
  async join(address, name) {
    this.stop();
    if (!/^[a-zA-Z0-9.\-]+:\d{1,5}\/[a-f0-9]{8}$/.test(address))
      throw Error("Use the host’s complete address:port/room code.");
    const s = (this.client = new WebSocket("ws://" + address, {
      maxPayload: 2e6,
      handshakeTimeout: 7000,
    }));
    await new Promise((resolve, reject) => {
      s.once("open", resolve);
      s.once("error", reject);
      s.once("close", () => reject(Error("Room rejected the connection.")));
    });
    s.on("message", (raw) => {
      try {
        this.emit(JSON.parse(raw));
      } catch {}
    });
    s.on("close", () => this.emit({ type: "disconnected" }));
    s.on("error", () => {});
    s.send(JSON.stringify({ type: "hello", name: String(name).slice(0, 16) }));
    return true;
  }
  send(data) {
    const body = JSON.stringify(data);
    if (body.length > 2e6) return;
    if (this.client?.readyState === 1) this.client.send(body);
    else
      for (const s of this.peers.values()) if (s.readyState === 1) s.send(body);
  }
}
module.exports = { RoomTransport };
