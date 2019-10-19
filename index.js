var EventEmitter = require('events')
var assert = require('assert')

class Cutter extends EventEmitter {
  constructor(headLength, getLength) {
    super()
    assert(
      typeof getLength === 'function',
      'getLength must be type of Function!'
    )
    assert(typeof headLength === 'number', 'headLength must be type of Number!')
    this.getLength = getLength
    this.headLength = headLength
    this.buf = null
  }
  handleData(data) {
    assert(data instanceof Buffer, 'data shoule be a buffer')
    if (!this.buf) {
      this.buf = data
    } else {
      const length = this.buf.length + data.length
      this.buf = Buffer.concat([this.buf, data], length)
    }
    this.handlePacket()
  }
  handlePacket() {
    if(!this.buf || this.buf.length < this.headLength) {
      return;
    }
    let offset = 0;
    let head = this.buf.slice(offset,offset + this.headLength);
    while(this.buf.length - offset >= this.headLength){
      // 获取到一个包的长度
      const  packetSize = this.getLength(head);
      if(packetSize <= this.headLength) {
        this.buf = null;
        this.emit('error', new Error('Get invalid packet size'))
        return ;
      }
      if(this.buf.length - offset >=  packetSize) {
        const packet = this.buf.slice(offset, offset + packetSize);
        // 移动offset
        offset += packetSize
        head = this.buf.slice(offset, offset + this.headLength)
        this.emit('packet', packet);
      }
    }
  }
  desotry() {
    this.removeAllListeners()
    this.buf = null
  }
  create(headLength, getLength) {
    return Cutter(headLength, getLength)
  }
}


module.exports = Cutter
