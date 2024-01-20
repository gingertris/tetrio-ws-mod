function doJSModification(text) {
    text = text.replace(`ws.send(SmartEncode(packet, ws.packr));`, `ws.send(SmartEncode(packet, ws.packr));modribbon.sendMessage(packet);`);
    text = text.replace(`const msg = SmartDecode(new Uint8Array(ab), this.unpackr);`, `const msg = SmartDecode(new Uint8Array(ab), this.unpackr);modribbon.receiveMessage(msg);`);
    return text;
}

module.exports = {doJSModification};

//modribbon.sendMessage(packet);
//modribbon.receiveMessage(packet);