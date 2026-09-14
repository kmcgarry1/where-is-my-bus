var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/protobufjs/src/util/aspromise.js
var require_aspromise = __commonJS({
  "node_modules/protobufjs/src/util/aspromise.js"(exports2, module2) {
    "use strict";
    module2.exports = asPromise;
    function asPromise(fn, ctx) {
      var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
      while (index < arguments.length)
        params[offset++] = arguments[index++];
      return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err) {
          if (pending) {
            pending = false;
            if (err)
              reject(err);
            else {
              var params2 = new Array(arguments.length - 1), offset2 = 0;
              while (offset2 < params2.length)
                params2[offset2++] = arguments[offset2];
              resolve.apply(null, params2);
            }
          }
        };
        try {
          fn.apply(ctx || null, params);
        } catch (err) {
          if (pending) {
            pending = false;
            reject(err);
          }
        }
      });
    }
  }
});

// node_modules/protobufjs/src/util/base64.js
var require_base64 = __commonJS({
  "node_modules/protobufjs/src/util/base64.js"(exports2) {
    "use strict";
    var base64 = exports2;
    base64.length = function length(string) {
      var p = string.length;
      if (!p)
        return 0;
      while (p > 0 && string.charAt(p - 1) === "=")
        --p;
      return Math.floor(p * 3 / 4);
    };
    var b64 = new Array(64);
    var s64 = new Array(123);
    for (i = 0; i < 64; )
      s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
    var i;
    s64[45] = 62;
    s64[95] = 63;
    base64.encode = function encode(buffer, start, end) {
      var parts = null, chunk = [];
      var i2 = 0, j = 0, t;
      while (start < end) {
        var b = buffer[start++];
        switch (j) {
          case 0:
            chunk[i2++] = b64[b >> 2];
            t = (b & 3) << 4;
            j = 1;
            break;
          case 1:
            chunk[i2++] = b64[t | b >> 4];
            t = (b & 15) << 2;
            j = 2;
            break;
          case 2:
            chunk[i2++] = b64[t | b >> 6];
            chunk[i2++] = b64[b & 63];
            j = 0;
            break;
        }
        if (i2 > 8191) {
          (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
          i2 = 0;
        }
      }
      if (j) {
        chunk[i2++] = b64[t];
        chunk[i2++] = 61;
        if (j === 1)
          chunk[i2++] = 61;
      }
      if (parts) {
        if (i2)
          parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
        return parts.join("");
      }
      return String.fromCharCode.apply(String, chunk.slice(0, i2));
    };
    var invalidEncoding = "invalid encoding";
    base64.decode = function decode(string, buffer, offset) {
      var start = offset;
      var j = 0, t;
      for (var i2 = 0; i2 < string.length; ) {
        var c = string.charCodeAt(i2++);
        if (c === 61 && j > 1)
          break;
        if ((c = s64[c]) === void 0)
          throw Error(invalidEncoding);
        switch (j) {
          case 0:
            t = c;
            j = 1;
            break;
          case 1:
            buffer[offset++] = t << 2 | (c & 48) >> 4;
            t = c;
            j = 2;
            break;
          case 2:
            buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
            t = c;
            j = 3;
            break;
          case 3:
            buffer[offset++] = (t & 3) << 6 | c;
            j = 0;
            break;
        }
      }
      if (j === 1)
        throw Error(invalidEncoding);
      return offset - start;
    };
    var base64Re = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    var base64UrlRe = /[-_]/;
    var base64UrlNoPaddingRe = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/;
    base64.test = function test(string) {
      return base64Re.test(string) || base64UrlRe.test(string) && base64UrlNoPaddingRe.test(string);
    };
  }
});

// node_modules/protobufjs/src/util/eventemitter.js
var require_eventemitter = __commonJS({
  "node_modules/protobufjs/src/util/eventemitter.js"(exports2, module2) {
    "use strict";
    module2.exports = EventEmitter;
    function EventEmitter() {
      this._listeners = /* @__PURE__ */ Object.create(null);
    }
    EventEmitter.prototype.on = function on(evt, fn, ctx) {
      (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn,
        ctx: ctx || this
      });
      return this;
    };
    EventEmitter.prototype.off = function off(evt, fn) {
      if (evt === void 0)
        this._listeners = /* @__PURE__ */ Object.create(null);
      else {
        if (fn === void 0)
          this._listeners[evt] = [];
        else {
          var listeners = this._listeners[evt];
          if (!listeners)
            return this;
          for (var i = 0; i < listeners.length; )
            if (listeners[i].fn === fn)
              listeners.splice(i, 1);
            else
              ++i;
        }
      }
      return this;
    };
    EventEmitter.prototype.emit = function emit(evt) {
      var listeners = this._listeners[evt];
      if (listeners) {
        var args = [], i = 1;
        for (; i < arguments.length; )
          args.push(arguments[i++]);
        for (i = 0; i < listeners.length; )
          listeners[i].fn.apply(listeners[i++].ctx, args);
      }
      return this;
    };
  }
});

// node_modules/protobufjs/src/util/float.js
var require_float = __commonJS({
  "node_modules/protobufjs/src/util/float.js"(exports2, module2) {
    "use strict";
    module2.exports = factory(factory);
    function factory(exports3) {
      if (typeof Float32Array !== "undefined") (function() {
        var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
        function writeFloat_f32_cpy(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
        }
        function writeFloat_f32_rev(val, buf, pos) {
          f32[0] = val;
          buf[pos] = f8b[3];
          buf[pos + 1] = f8b[2];
          buf[pos + 2] = f8b[1];
          buf[pos + 3] = f8b[0];
        }
        exports3.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        exports3.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
        function readFloat_f32_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          return f32[0];
        }
        function readFloat_f32_rev(buf, pos) {
          f8b[3] = buf[pos];
          f8b[2] = buf[pos + 1];
          f8b[1] = buf[pos + 2];
          f8b[0] = buf[pos + 3];
          return f32[0];
        }
        exports3.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        exports3.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
      })();
      else (function() {
        function writeFloat_ieee754(writeUint, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0)
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos);
          else if (isNaN(val))
            writeUint(2143289344, buf, pos);
          else if (val > 34028234663852886e22)
            writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
          else if (val < 11754943508222875e-54)
            writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
          else {
            var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
            writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
          }
        }
        exports3.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports3.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
        function readFloat_ieee754(readUint, buf, pos) {
          var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
          return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }
        exports3.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports3.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
      })();
      if (typeof Float64Array !== "undefined") (function() {
        var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
        function writeDouble_f64_cpy(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[0];
          buf[pos + 1] = f8b[1];
          buf[pos + 2] = f8b[2];
          buf[pos + 3] = f8b[3];
          buf[pos + 4] = f8b[4];
          buf[pos + 5] = f8b[5];
          buf[pos + 6] = f8b[6];
          buf[pos + 7] = f8b[7];
        }
        function writeDouble_f64_rev(val, buf, pos) {
          f64[0] = val;
          buf[pos] = f8b[7];
          buf[pos + 1] = f8b[6];
          buf[pos + 2] = f8b[5];
          buf[pos + 3] = f8b[4];
          buf[pos + 4] = f8b[3];
          buf[pos + 5] = f8b[2];
          buf[pos + 6] = f8b[1];
          buf[pos + 7] = f8b[0];
        }
        exports3.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        exports3.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
        function readDouble_f64_cpy(buf, pos) {
          f8b[0] = buf[pos];
          f8b[1] = buf[pos + 1];
          f8b[2] = buf[pos + 2];
          f8b[3] = buf[pos + 3];
          f8b[4] = buf[pos + 4];
          f8b[5] = buf[pos + 5];
          f8b[6] = buf[pos + 6];
          f8b[7] = buf[pos + 7];
          return f64[0];
        }
        function readDouble_f64_rev(buf, pos) {
          f8b[7] = buf[pos];
          f8b[6] = buf[pos + 1];
          f8b[5] = buf[pos + 2];
          f8b[4] = buf[pos + 3];
          f8b[3] = buf[pos + 4];
          f8b[2] = buf[pos + 5];
          f8b[1] = buf[pos + 6];
          f8b[0] = buf[pos + 7];
          return f64[0];
        }
        exports3.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        exports3.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
      })();
      else (function() {
        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
          var sign = val < 0 ? 1 : 0;
          if (sign)
            val = -val;
          if (val === 0) {
            writeUint(0, buf, pos + off0);
            writeUint(1 / val > 0 ? (
              /* positive */
              0
            ) : (
              /* negative 0 */
              2147483648
            ), buf, pos + off1);
          } else if (isNaN(val)) {
            writeUint(0, buf, pos + off0);
            writeUint(2146959360, buf, pos + off1);
          } else if (val > 17976931348623157e292) {
            writeUint(0, buf, pos + off0);
            writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
          } else {
            var mantissa;
            if (val < 22250738585072014e-324) {
              mantissa = val / 5e-324;
              writeUint(mantissa >>> 0, buf, pos + off0);
              writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
            } else {
              var exponent = Math.floor(Math.log(val) / Math.LN2);
              if (exponent === 1024)
                exponent = 1023;
              mantissa = val * Math.pow(2, -exponent);
              writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
              writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
            }
          }
        }
        exports3.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports3.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
          var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
          var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
          return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }
        exports3.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports3.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
      })();
      return exports3;
    }
    function writeUintLE(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    function writeUintBE(val, buf, pos) {
      buf[pos] = val >>> 24;
      buf[pos + 1] = val >>> 16 & 255;
      buf[pos + 2] = val >>> 8 & 255;
      buf[pos + 3] = val & 255;
    }
    function readUintLE(buf, pos) {
      return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
    }
    function readUintBE(buf, pos) {
      return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
    }
  }
});

// node_modules/protobufjs/src/util/utf8.js
var require_utf8 = __commonJS({
  "node_modules/protobufjs/src/util/utf8.js"(exports2) {
    "use strict";
    var utf8 = exports2;
    var looseDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
    var strictDecoder;
    var TEXT_DECODER_MIN_LENGTH = 64;
    try {
      strictDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    } catch (err) {
      strictDecoder = looseDecoder;
    }
    utf8.length = function utf8_length(string) {
      var len = 0, c = 0;
      for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
          len += 1;
        else if (c < 2048)
          len += 2;
        else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
          ++i;
          len += 4;
        } else
          len += 3;
      }
      return len;
    };
    function utf8_read_decoder(decoder, buffer, start, end) {
      var source = start === 0 && end === buffer.length ? buffer : buffer.subarray(start, end);
      return decoder.decode(source);
    }
    utf8.read = function utf8_read_loose(buffer, start, end) {
      if (end - start < 1)
        return "";
      if (end - start >= TEXT_DECODER_MIN_LENGTH)
        return utf8_read_decoder(looseDecoder, buffer, start, end);
      var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
      for (; i + 7 < end; i += 8) {
        c1 = buffer[i];
        c2 = buffer[i + 1];
        c3 = buffer[i + 2];
        c4 = buffer[i + 3];
        c5 = buffer[i + 4];
        c6 = buffer[i + 5];
        c7 = buffer[i + 6];
        c8 = buffer[i + 7];
        if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
          return str + utf8_read_decoder(looseDecoder, buffer, i, end);
        str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
      }
      for (; i < end; ++i) {
        c1 = buffer[i];
        if (c1 & 128)
          return str + utf8_read_decoder(looseDecoder, buffer, i, end);
        str += String.fromCharCode(c1);
      }
      return str;
    };
    utf8.readStrict = function utf8_read_strict(buffer, start, end) {
      if (end - start < 1)
        return "";
      if (end - start >= TEXT_DECODER_MIN_LENGTH)
        return utf8_read_decoder(strictDecoder, buffer, start, end);
      var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
      for (; i + 7 < end; i += 8) {
        c1 = buffer[i];
        c2 = buffer[i + 1];
        c3 = buffer[i + 2];
        c4 = buffer[i + 3];
        c5 = buffer[i + 4];
        c6 = buffer[i + 5];
        c7 = buffer[i + 6];
        c8 = buffer[i + 7];
        if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
          return str + utf8_read_decoder(strictDecoder, buffer, i, end);
        str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
      }
      for (; i < end; ++i) {
        c1 = buffer[i];
        if (c1 & 128)
          return str + utf8_read_decoder(strictDecoder, buffer, i, end);
        str += String.fromCharCode(c1);
      }
      return str;
    };
    utf8.write = function utf8_write(string, buffer, offset) {
      var start = offset, c1, c2;
      for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
          buffer[offset++] = c1;
        } else if (c1 < 2048) {
          buffer[offset++] = c1 >> 6 | 192;
          buffer[offset++] = c1 & 63 | 128;
        } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
          c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
          ++i;
          buffer[offset++] = c1 >> 18 | 240;
          buffer[offset++] = c1 >> 12 & 63 | 128;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        } else {
          buffer[offset++] = c1 >> 12 | 224;
          buffer[offset++] = c1 >> 6 & 63 | 128;
          buffer[offset++] = c1 & 63 | 128;
        }
      }
      return offset - start;
    };
  }
});

// node_modules/protobufjs/src/util/pool.js
var require_pool = __commonJS({
  "node_modules/protobufjs/src/util/pool.js"(exports2, module2) {
    "use strict";
    module2.exports = pool;
    function pool(alloc, slice, size) {
      var SIZE = size || 8192;
      var MAX = SIZE >>> 1;
      var slab = null;
      var offset = SIZE;
      return function pool_alloc(size2) {
        if (size2 < 1 || size2 > MAX)
          return alloc(size2);
        if (offset + size2 > SIZE) {
          slab = alloc(SIZE);
          offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size2);
        if (offset & 7)
          offset = (offset | 7) + 1;
        return buf;
      };
    }
  }
});

// node_modules/protobufjs/src/util/longbits.js
var require_longbits = __commonJS({
  "node_modules/protobufjs/src/util/longbits.js"(exports2, module2) {
    "use strict";
    module2.exports = LongBits;
    var Long;
    function LongBits(lo, hi) {
      this.lo = lo >>> 0;
      this.hi = hi >>> 0;
    }
    var zero = LongBits.zero = new LongBits(0, 0);
    zero.toNumber = function() {
      return 0;
    };
    zero.zzEncode = zero.zzDecode = function() {
      return this;
    };
    zero.length = function() {
      return 1;
    };
    var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
    LongBits.fromNumber = function fromNumber(value) {
      if (value === 0)
        return zero;
      var sign = value < 0;
      if (sign)
        value = -value;
      var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
      if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
          lo = 0;
          if (++hi > 4294967295)
            hi = 0;
        }
      }
      return new LongBits(lo, hi);
    };
    LongBits.from = function from(value) {
      if (typeof value === "number")
        return LongBits.fromNumber(value);
      if (typeof value === "string" || value instanceof String) {
        if (Long)
          value = Long.fromString(value);
        else
          return LongBits.fromNumber(parseInt(value, 10));
      }
      return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
    };
    LongBits.prototype.toNumber = function toNumber(unsigned) {
      if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
        if (!lo)
          hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
      }
      return this.lo + this.hi * 4294967296;
    };
    LongBits.prototype.toLong = function toLong(unsigned) {
      return Long ? new Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
    };
    var charCodeAt = String.prototype.charCodeAt;
    LongBits.fromHash = function fromHash(hash) {
      if (hash === zeroHash)
        return zero;
      return new LongBits(
        (charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0,
        (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0
      );
    };
    LongBits.prototype.toHash = function toHash() {
      return String.fromCharCode(
        this.lo & 255,
        this.lo >>> 8 & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24,
        this.hi & 255,
        this.hi >>> 8 & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
      );
    };
    LongBits.prototype.zzEncode = function zzEncode() {
      var mask = this.hi >> 31;
      this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
      this.lo = (this.lo << 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.zzDecode = function zzDecode() {
      var mask = -(this.lo & 1);
      this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
      this.hi = (this.hi >>> 1 ^ mask) >>> 0;
      return this;
    };
    LongBits.prototype.length = function length() {
      var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
      return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
    };
    LongBits._configure = function(Long_) {
      Long = Long_;
    };
  }
});

// node_modules/long/umd/index.js
var require_umd = __commonJS({
  "node_modules/long/umd/index.js"(exports2, module2) {
    (function(global2, factory) {
      function preferDefault(exports3) {
        return exports3.default || exports3;
      }
      if (typeof define === "function" && define.amd) {
        define([], function() {
          var exports3 = {};
          factory(exports3);
          return preferDefault(exports3);
        });
      } else if (typeof exports2 === "object") {
        factory(exports2);
        if (typeof module2 === "object") module2.exports = preferDefault(exports2);
      } else {
        (function() {
          var exports3 = {};
          factory(exports3);
          global2.Long = preferDefault(exports3);
        })();
      }
    })(
      typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports2,
      function(_exports) {
        "use strict";
        Object.defineProperty(_exports, "__esModule", {
          value: true
        });
        _exports.default = void 0;
        var wasm = null;
        try {
          wasm = new WebAssembly.Instance(
            new WebAssembly.Module(
              new Uint8Array([
                // \0asm
                0,
                97,
                115,
                109,
                // version 1
                1,
                0,
                0,
                0,
                // section "type"
                1,
                13,
                2,
                // 0, () => i32
                96,
                0,
                1,
                127,
                // 1, (i32, i32, i32, i32) => i32
                96,
                4,
                127,
                127,
                127,
                127,
                1,
                127,
                // section "function"
                3,
                7,
                6,
                // 0, type 0
                0,
                // 1, type 1
                1,
                // 2, type 1
                1,
                // 3, type 1
                1,
                // 4, type 1
                1,
                // 5, type 1
                1,
                // section "global"
                6,
                6,
                1,
                // 0, "high", mutable i32
                127,
                1,
                65,
                0,
                11,
                // section "export"
                7,
                50,
                6,
                // 0, "mul"
                3,
                109,
                117,
                108,
                0,
                1,
                // 1, "div_s"
                5,
                100,
                105,
                118,
                95,
                115,
                0,
                2,
                // 2, "div_u"
                5,
                100,
                105,
                118,
                95,
                117,
                0,
                3,
                // 3, "rem_s"
                5,
                114,
                101,
                109,
                95,
                115,
                0,
                4,
                // 4, "rem_u"
                5,
                114,
                101,
                109,
                95,
                117,
                0,
                5,
                // 5, "get_high"
                8,
                103,
                101,
                116,
                95,
                104,
                105,
                103,
                104,
                0,
                0,
                // section "code"
                10,
                191,
                1,
                6,
                // 0, "get_high"
                4,
                0,
                35,
                0,
                11,
                // 1, "mul"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                126,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 2, "div_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                127,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 3, "div_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                128,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 4, "rem_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                129,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 5, "rem_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                130,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11
              ])
            ),
            {}
          ).exports;
        } catch {
        }
        function Long(low, high, unsigned) {
          this.low = low | 0;
          this.high = high | 0;
          this.unsigned = !!unsigned;
        }
        Long.prototype.__isLong__;
        Object.defineProperty(Long.prototype, "__isLong__", {
          value: true
        });
        function isLong(obj) {
          return (obj && obj["__isLong__"]) === true;
        }
        function ctz32(value) {
          var c = Math.clz32(value & -value);
          return value ? 31 - c : c;
        }
        Long.isLong = isLong;
        var INT_CACHE = {};
        var UINT_CACHE = {};
        function fromInt(value, unsigned) {
          var obj, cachedObj, cache2;
          if (unsigned) {
            value >>>= 0;
            if (cache2 = 0 <= value && value < 256) {
              cachedObj = UINT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, 0, true);
            if (cache2) UINT_CACHE[value] = obj;
            return obj;
          } else {
            value |= 0;
            if (cache2 = -128 <= value && value < 128) {
              cachedObj = INT_CACHE[value];
              if (cachedObj) return cachedObj;
            }
            obj = fromBits(value, value < 0 ? -1 : 0, false);
            if (cache2) INT_CACHE[value] = obj;
            return obj;
          }
        }
        Long.fromInt = fromInt;
        function fromNumber(value, unsigned) {
          if (isNaN(value)) return unsigned ? UZERO : ZERO;
          if (unsigned) {
            if (value < 0) return UZERO;
            if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
          } else {
            if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
            if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
          }
          if (value < 0) return fromNumber(-value, unsigned).neg();
          return fromBits(
            value % TWO_PWR_32_DBL | 0,
            value / TWO_PWR_32_DBL | 0,
            unsigned
          );
        }
        Long.fromNumber = fromNumber;
        function fromBits(lowBits, highBits, unsigned) {
          return new Long(lowBits, highBits, unsigned);
        }
        Long.fromBits = fromBits;
        var pow_dbl = Math.pow;
        function fromString(str, unsigned, radix) {
          if (str.length === 0) throw Error("empty string");
          if (typeof unsigned === "number") {
            radix = unsigned;
            unsigned = false;
          } else {
            unsigned = !!unsigned;
          }
          if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return unsigned ? UZERO : ZERO;
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          var p;
          if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
          else if (p === 0) {
            return fromString(str.substring(1), unsigned, radix).neg();
          }
          var radixToPower = fromNumber(pow_dbl(radix, 8));
          var result = ZERO;
          for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
              var power = fromNumber(pow_dbl(radix, size));
              result = result.mul(power).add(fromNumber(value));
            } else {
              result = result.mul(radixToPower);
              result = result.add(fromNumber(value));
            }
          }
          result.unsigned = unsigned;
          return result;
        }
        Long.fromString = fromString;
        function fromValue(val, unsigned) {
          if (typeof val === "number") return fromNumber(val, unsigned);
          if (typeof val === "string") return fromString(val, unsigned);
          return fromBits(
            val.low,
            val.high,
            typeof unsigned === "boolean" ? unsigned : val.unsigned
          );
        }
        Long.fromValue = fromValue;
        var TWO_PWR_16_DBL = 1 << 16;
        var TWO_PWR_24_DBL = 1 << 24;
        var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
        var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
        var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
        var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
        var ZERO = fromInt(0);
        Long.ZERO = ZERO;
        var UZERO = fromInt(0, true);
        Long.UZERO = UZERO;
        var ONE = fromInt(1);
        Long.ONE = ONE;
        var UONE = fromInt(1, true);
        Long.UONE = UONE;
        var NEG_ONE = fromInt(-1);
        Long.NEG_ONE = NEG_ONE;
        var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
        Long.MAX_VALUE = MAX_VALUE;
        var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
        Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
        var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
        Long.MIN_VALUE = MIN_VALUE;
        var LongPrototype = Long.prototype;
        LongPrototype.toInt = function toInt() {
          return this.unsigned ? this.low >>> 0 : this.low;
        };
        LongPrototype.toNumber = function toNumber() {
          if (this.unsigned)
            return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
          return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
        };
        LongPrototype.toString = function toString(radix) {
          radix = radix || 10;
          if (radix < 2 || 36 < radix) throw RangeError("radix");
          if (this.isZero()) return "0";
          if (this.isNegative()) {
            if (this.eq(MIN_VALUE)) {
              var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
              return div.toString(radix) + rem1.toInt().toString(radix);
            } else return "-" + this.neg().toString(radix);
          }
          var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
          var result = "";
          while (true) {
            var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero()) return digits + result;
            else {
              while (digits.length < 6) digits = "0" + digits;
              result = "" + digits + result;
            }
          }
        };
        LongPrototype.getHighBits = function getHighBits() {
          return this.high;
        };
        LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
          return this.high >>> 0;
        };
        LongPrototype.getLowBits = function getLowBits() {
          return this.low;
        };
        LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
          return this.low >>> 0;
        };
        LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
          if (this.isNegative())
            return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
          var val = this.high != 0 ? this.high : this.low;
          for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;
          return this.high != 0 ? bit + 33 : bit + 1;
        };
        LongPrototype.isSafeInteger = function isSafeInteger() {
          var top11Bits = this.high >> 21;
          if (!top11Bits) return true;
          if (this.unsigned) return false;
          return top11Bits === -1 && !(this.low === 0 && this.high === -2097152);
        };
        LongPrototype.isZero = function isZero() {
          return this.high === 0 && this.low === 0;
        };
        LongPrototype.eqz = LongPrototype.isZero;
        LongPrototype.isNegative = function isNegative() {
          return !this.unsigned && this.high < 0;
        };
        LongPrototype.isPositive = function isPositive() {
          return this.unsigned || this.high >= 0;
        };
        LongPrototype.isOdd = function isOdd() {
          return (this.low & 1) === 1;
        };
        LongPrototype.isEven = function isEven() {
          return (this.low & 1) === 0;
        };
        LongPrototype.equals = function equals(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
            return false;
          return this.high === other.high && this.low === other.low;
        };
        LongPrototype.eq = LongPrototype.equals;
        LongPrototype.notEquals = function notEquals(other) {
          return !this.eq(
            /* validates */
            other
          );
        };
        LongPrototype.neq = LongPrototype.notEquals;
        LongPrototype.ne = LongPrototype.notEquals;
        LongPrototype.lessThan = function lessThan(other) {
          return this.comp(
            /* validates */
            other
          ) < 0;
        };
        LongPrototype.lt = LongPrototype.lessThan;
        LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) <= 0;
        };
        LongPrototype.lte = LongPrototype.lessThanOrEqual;
        LongPrototype.le = LongPrototype.lessThanOrEqual;
        LongPrototype.greaterThan = function greaterThan(other) {
          return this.comp(
            /* validates */
            other
          ) > 0;
        };
        LongPrototype.gt = LongPrototype.greaterThan;
        LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
          return this.comp(
            /* validates */
            other
          ) >= 0;
        };
        LongPrototype.gte = LongPrototype.greaterThanOrEqual;
        LongPrototype.ge = LongPrototype.greaterThanOrEqual;
        LongPrototype.compare = function compare(other) {
          if (!isLong(other)) other = fromValue(other);
          if (this.eq(other)) return 0;
          var thisNeg = this.isNegative(), otherNeg = other.isNegative();
          if (thisNeg && !otherNeg) return -1;
          if (!thisNeg && otherNeg) return 1;
          if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
          return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
        };
        LongPrototype.comp = LongPrototype.compare;
        LongPrototype.negate = function negate() {
          if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
          return this.not().add(ONE);
        };
        LongPrototype.neg = LongPrototype.negate;
        LongPrototype.add = function add(addend) {
          if (!isLong(addend)) addend = fromValue(addend);
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = addend.high >>> 16;
          var b32 = addend.high & 65535;
          var b16 = addend.low >>> 16;
          var b00 = addend.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 + b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 + b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 + b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 + b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.subtract = function subtract(subtrahend) {
          if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
          return this.add(subtrahend.neg());
        };
        LongPrototype.sub = LongPrototype.subtract;
        LongPrototype.multiply = function multiply(multiplier) {
          if (this.isZero()) return this;
          if (!isLong(multiplier)) multiplier = fromValue(multiplier);
          if (wasm) {
            var low = wasm["mul"](
              this.low,
              this.high,
              multiplier.low,
              multiplier.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
          if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
          if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
          if (this.isNegative()) {
            if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());
            else return this.neg().mul(multiplier).neg();
          } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();
          if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
            return fromNumber(
              this.toNumber() * multiplier.toNumber(),
              this.unsigned
            );
          var a48 = this.high >>> 16;
          var a32 = this.high & 65535;
          var a16 = this.low >>> 16;
          var a00 = this.low & 65535;
          var b48 = multiplier.high >>> 16;
          var b32 = multiplier.high & 65535;
          var b16 = multiplier.low >>> 16;
          var b00 = multiplier.low & 65535;
          var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
          c00 += a00 * b00;
          c16 += c00 >>> 16;
          c00 &= 65535;
          c16 += a16 * b00;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c16 += a00 * b16;
          c32 += c16 >>> 16;
          c16 &= 65535;
          c32 += a32 * b00;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a16 * b16;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c32 += a00 * b32;
          c48 += c32 >>> 16;
          c32 &= 65535;
          c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
          c48 &= 65535;
          return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
        };
        LongPrototype.mul = LongPrototype.multiply;
        LongPrototype.divide = function divide(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (divisor.isZero()) throw Error("division by zero");
          if (wasm) {
            if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
              return this;
            }
            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          if (this.isZero()) return this.unsigned ? UZERO : ZERO;
          var approx, rem, res;
          if (!this.unsigned) {
            if (this.eq(MIN_VALUE)) {
              if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                return MIN_VALUE;
              else if (divisor.eq(MIN_VALUE)) return ONE;
              else {
                var halfThis = this.shr(1);
                approx = halfThis.div(divisor).shl(1);
                if (approx.eq(ZERO)) {
                  return divisor.isNegative() ? ONE : NEG_ONE;
                } else {
                  rem = this.sub(divisor.mul(approx));
                  res = approx.add(rem.div(divisor));
                  return res;
                }
              }
            } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
            if (this.isNegative()) {
              if (divisor.isNegative()) return this.neg().div(divisor.neg());
              return this.neg().div(divisor).neg();
            } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();
            res = ZERO;
          } else {
            if (!divisor.unsigned) divisor = divisor.toUnsigned();
            if (divisor.gt(this)) return UZERO;
            if (divisor.gt(this.shru(1)))
              return UONE;
            res = UZERO;
          }
          rem = this;
          while (rem.gte(divisor)) {
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
            var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
              approx -= delta;
              approxRes = fromNumber(approx, this.unsigned);
              approxRem = approxRes.mul(divisor);
            }
            if (approxRes.isZero()) approxRes = ONE;
            res = res.add(approxRes);
            rem = rem.sub(approxRem);
          }
          return res;
        };
        LongPrototype.div = LongPrototype.divide;
        LongPrototype.modulo = function modulo(divisor) {
          if (!isLong(divisor)) divisor = fromValue(divisor);
          if (wasm) {
            var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
              this.low,
              this.high,
              divisor.low,
              divisor.high
            );
            return fromBits(low, wasm["get_high"](), this.unsigned);
          }
          return this.sub(this.div(divisor).mul(divisor));
        };
        LongPrototype.mod = LongPrototype.modulo;
        LongPrototype.rem = LongPrototype.modulo;
        LongPrototype.not = function not() {
          return fromBits(~this.low, ~this.high, this.unsigned);
        };
        LongPrototype.countLeadingZeros = function countLeadingZeros() {
          return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
        };
        LongPrototype.clz = LongPrototype.countLeadingZeros;
        LongPrototype.countTrailingZeros = function countTrailingZeros() {
          return this.low ? ctz32(this.low) : ctz32(this.high) + 32;
        };
        LongPrototype.ctz = LongPrototype.countTrailingZeros;
        LongPrototype.and = function and(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low & other.low,
            this.high & other.high,
            this.unsigned
          );
        };
        LongPrototype.or = function or(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low | other.low,
            this.high | other.high,
            this.unsigned
          );
        };
        LongPrototype.xor = function xor(other) {
          if (!isLong(other)) other = fromValue(other);
          return fromBits(
            this.low ^ other.low,
            this.high ^ other.high,
            this.unsigned
          );
        };
        LongPrototype.shiftLeft = function shiftLeft(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low << numBits,
              this.high << numBits | this.low >>> 32 - numBits,
              this.unsigned
            );
          else return fromBits(0, this.low << numBits - 32, this.unsigned);
        };
        LongPrototype.shl = LongPrototype.shiftLeft;
        LongPrototype.shiftRight = function shiftRight(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          else if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >> numBits,
              this.unsigned
            );
          else
            return fromBits(
              this.high >> numBits - 32,
              this.high >= 0 ? 0 : -1,
              this.unsigned
            );
        };
        LongPrototype.shr = LongPrototype.shiftRight;
        LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits < 32)
            return fromBits(
              this.low >>> numBits | this.high << 32 - numBits,
              this.high >>> numBits,
              this.unsigned
            );
          if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
          return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
        };
        LongPrototype.shru = LongPrototype.shiftRightUnsigned;
        LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
        LongPrototype.rotateLeft = function rotateLeft(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.low << numBits | this.high >>> b,
              this.high << numBits | this.low >>> b,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.high << numBits | this.low >>> b,
            this.low << numBits | this.high >>> b,
            this.unsigned
          );
        };
        LongPrototype.rotl = LongPrototype.rotateLeft;
        LongPrototype.rotateRight = function rotateRight(numBits) {
          var b;
          if (isLong(numBits)) numBits = numBits.toInt();
          if ((numBits &= 63) === 0) return this;
          if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
          if (numBits < 32) {
            b = 32 - numBits;
            return fromBits(
              this.high << b | this.low >>> numBits,
              this.low << b | this.high >>> numBits,
              this.unsigned
            );
          }
          numBits -= 32;
          b = 32 - numBits;
          return fromBits(
            this.low << b | this.high >>> numBits,
            this.high << b | this.low >>> numBits,
            this.unsigned
          );
        };
        LongPrototype.rotr = LongPrototype.rotateRight;
        LongPrototype.toSigned = function toSigned() {
          if (!this.unsigned) return this;
          return fromBits(this.low, this.high, false);
        };
        LongPrototype.toUnsigned = function toUnsigned() {
          if (this.unsigned) return this;
          return fromBits(this.low, this.high, true);
        };
        LongPrototype.toBytes = function toBytes(le) {
          return le ? this.toBytesLE() : this.toBytesBE();
        };
        LongPrototype.toBytesLE = function toBytesLE() {
          var hi = this.high, lo = this.low;
          return [
            lo & 255,
            lo >>> 8 & 255,
            lo >>> 16 & 255,
            lo >>> 24,
            hi & 255,
            hi >>> 8 & 255,
            hi >>> 16 & 255,
            hi >>> 24
          ];
        };
        LongPrototype.toBytesBE = function toBytesBE() {
          var hi = this.high, lo = this.low;
          return [
            hi >>> 24,
            hi >>> 16 & 255,
            hi >>> 8 & 255,
            hi & 255,
            lo >>> 24,
            lo >>> 16 & 255,
            lo >>> 8 & 255,
            lo & 255
          ];
        };
        Long.fromBytes = function fromBytes(bytes, unsigned, le) {
          return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
        };
        Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
          return new Long(
            bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
            bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
            unsigned
          );
        };
        Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
          return new Long(
            bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
            bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
            unsigned
          );
        };
        if (typeof BigInt === "function") {
          Long.fromBigInt = function fromBigInt(value, unsigned) {
            var lowBits = Number(BigInt.asIntN(32, value));
            var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
            return fromBits(lowBits, highBits, unsigned);
          };
          Long.fromValue = function fromValueWithBigInt(value, unsigned) {
            if (typeof value === "bigint") return Long.fromBigInt(value, unsigned);
            return fromValue(value, unsigned);
          };
          LongPrototype.toBigInt = function toBigInt() {
            var lowBigInt = BigInt(this.low >>> 0);
            var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
            return highBigInt << BigInt(32) | lowBigInt;
          };
        }
        var _default = _exports.default = Long;
      }
    );
  }
});

// node_modules/protobufjs/src/util/minimal.js
var require_minimal = __commonJS({
  "node_modules/protobufjs/src/util/minimal.js"(exports2) {
    "use strict";
    var util = exports2;
    util.asPromise = require_aspromise();
    util.base64 = require_base64();
    util.EventEmitter = require_eventemitter();
    util.float = require_float();
    util.utf8 = require_utf8();
    util.pool = require_pool();
    util.LongBits = require_longbits();
    function isUnsafeProperty(key) {
      return key === "__proto__" || key === "prototype" || key === "constructor";
    }
    util.isUnsafeProperty = isUnsafeProperty;
    util.isNode = Boolean(typeof global !== "undefined" && global && global.process && global.process.versions && global.process.versions.node);
    util.global = util.isNode && global || typeof window !== "undefined" && window || typeof self !== "undefined" && self || typeof globalThis !== "undefined" && globalThis || exports2;
    util.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    );
    util.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    );
    util.isInteger = Number.isInteger || /* istanbul ignore next */
    function isInteger(value) {
      return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };
    util.isString = function isString(value) {
      return typeof value === "string" || value instanceof String;
    };
    util.isObject = function isObject(value) {
      return value && typeof value === "object";
    };
    util.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
      var value = obj[prop];
      if (value != null && Object.hasOwnProperty.call(obj, prop))
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
      return false;
    };
    util.Buffer = (function() {
      try {
        var Buffer2 = util.global.Buffer;
        return Buffer2.prototype.utf8Write || util.isNode ? Buffer2 : (
          /* istanbul ignore next */
          null
        );
      } catch (e) {
        return null;
      }
    })();
    util.newBuffer = function newBuffer(sizeOrArray) {
      var Buffer2 = util.Buffer;
      return typeof sizeOrArray === "number" ? Buffer2 ? Buffer2.allocUnsafe(sizeOrArray) : new Uint8Array(sizeOrArray) : Buffer2 ? Buffer2.from(sizeOrArray) : new Uint8Array(sizeOrArray);
    };
    util.rawField = function rawField(id, wireType, data) {
      var out = [], tag = id << 3 | wireType;
      tag >>>= 0;
      while (tag > 127) {
        out.push(tag & 127 | 128);
        tag >>>= 7;
      }
      out.push(tag);
      for (var i = 0; i < data.length; ++i)
        out.push(data[i]);
      return util.newBuffer(out);
    };
    util.Array = Uint8Array;
    util.Long = /* istanbul ignore next */
    util.global.dcodeIO && /* istanbul ignore next */
    util.global.dcodeIO.Long || /* istanbul ignore next */
    util.global.Long || (function() {
      try {
        var Long = require_umd();
        return Long && Long.isLong ? Long : null;
      } catch (e) {
        return null;
      }
    })();
    util.key2Re = /^(?:true|false|0|1)$/;
    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
    util.key64Re = /^(?:[\x00-\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
    util.longToHash = function longToHash(value) {
      return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
    };
    util.longFromHash = function longFromHash(hash, unsigned) {
      var bits = util.LongBits.fromHash(hash);
      if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
      return bits.toNumber(Boolean(unsigned));
    };
    util.longFromKey = function longFromKey(key, unsigned) {
      return util.key64Re.test(key) && !util.key32Re.test(key) ? util.longFromHash(key, unsigned) : key;
    };
    util.boolFromKey = function boolFromKey(key) {
      return key === "true" || key === "1";
    };
    function merge(dst) {
      var ifNotSet = typeof arguments[arguments.length - 1] === "boolean", limit = ifNotSet ? arguments.length - 1 : arguments.length;
      ifNotSet = ifNotSet && arguments[arguments.length - 1];
      for (var a = 1; a < limit; ++a) {
        var src = arguments[a];
        if (!src)
          continue;
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
          if (!isUnsafeProperty(keys[i]) && (!ifNotSet || !Object.prototype.hasOwnProperty.call(dst, keys[i]) || dst[keys[i]] === void 0))
            dst[keys[i]] = src[keys[i]];
      }
      return dst;
    }
    util.merge = merge;
    util.nestingLimit = 32;
    util.recursionLimit = 100;
    util.makeProp = function makeProp(obj, key, enumerable) {
      if (Object.prototype.hasOwnProperty.call(obj, key))
        return;
      Object.defineProperty(obj, key, {
        enumerable: enumerable === void 0 ? true : enumerable,
        configurable: true,
        writable: true
      });
    };
    util.lcFirst = function lcFirst(str) {
      return str.charAt(0).toLowerCase() + str.substring(1);
    };
    function newError(name) {
      function CustomError(message, properties) {
        if (!(this instanceof CustomError))
          return new CustomError(message, properties);
        Object.defineProperty(this, "message", { get: function() {
          return message;
        } });
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, CustomError);
        else
          Object.defineProperty(this, "stack", { value: new Error().stack || "" });
        if (properties)
          merge(this, properties);
      }
      CustomError.prototype = Object.create(Error.prototype, {
        constructor: {
          value: CustomError,
          writable: true,
          enumerable: false,
          configurable: true
        },
        name: {
          get: function get() {
            return name;
          },
          set: void 0,
          enumerable: false,
          // configurable: false would accurately preserve the behavior of
          // the original, but I'm guessing that was not intentional.
          // For an actual error subclass, this property would
          // be configurable.
          configurable: true
        },
        toString: {
          value: function value() {
            return this.name + ": " + this.message;
          },
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      return CustomError;
    }
    util.newError = newError;
    util.ProtocolError = newError("ProtocolError");
    util.oneOfGetter = function getOneOf(fieldNames) {
      var fieldMap = {};
      for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;
      return function() {
        for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
          if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
            return keys[i2];
      };
    };
    util.oneOfSetter = function setOneOf(fieldNames) {
      return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
          if (fieldNames[i] !== name)
            delete this[fieldNames[i]];
      };
    };
    util.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: true
    };
  }
});

// node_modules/protobufjs/src/writer.js
var require_writer = __commonJS({
  "node_modules/protobufjs/src/writer.js"(exports2, module2) {
    "use strict";
    module2.exports = Writer;
    var util = require_minimal();
    var BufferWriter;
    var LongBits = util.LongBits;
    var base64 = util.base64;
    var utf8 = util.utf8;
    function Writer() {
      this.pos = 0;
      this.buf = this.constructor.alloc(Writer.initialBufferSize);
      this.view = null;
      this.states = null;
    }
    Writer.initialBufferSize = 128;
    Object.defineProperty(Writer.prototype, "len", {
      configurable: true,
      enumerable: true,
      get: function get_len() {
        return this.pos;
      }
    });
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup() {
        return (Writer.create = function create_buffer() {
          return new BufferWriter();
        })();
      } : function create_array() {
        return new Writer();
      };
    };
    Writer.create = create();
    Writer.alloc = function alloc(size) {
      return new Uint8Array(size);
    };
    Writer.alloc = util.pool(Writer.alloc, Uint8Array.prototype.subarray);
    function sizeVarint32(value) {
      return value < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5;
    }
    Writer.prototype._reserve = function _reserve(n) {
      var need = this.pos + n;
      if (need > this.buf.length) {
        var size = this.buf.length << 1;
        if (size < need)
          size = need;
        var buf = this.constructor.alloc(size);
        buf.set(this.buf.subarray(0, this.pos), 0);
        this.buf = buf;
        this.view = null;
      }
    };
    function writeStringAscii(val, buf, pos) {
      for (var i = 0; i < val.length; )
        buf[pos++] = val.charCodeAt(i++);
    }
    function writeVarint32(val, buf, pos) {
      while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
      }
      buf[pos] = val;
      return pos + 1;
    }
    Writer.prototype.uint32 = function write_uint32(value) {
      value = value >>> 0;
      this._reserve(5);
      var pos = this.pos;
      this.pos = writeVarint32(value, this.buf, pos);
      return this;
    };
    Writer.prototype.int32 = function write_int32(value) {
      if ((value |= 0) < 0) {
        this._reserve(10);
        writeVarint64(LongBits.fromNumber(value), this.buf, this.pos);
        this.pos += 10;
        return this;
      }
      return this.uint32(value);
    };
    Writer.prototype.sint32 = function write_sint32(value) {
      return this.uint32((value << 1 ^ value >> 31) >>> 0);
    };
    function writeVarint64(val, buf, pos) {
      var lo = val.lo, hi = val.hi;
      while (hi) {
        buf[pos++] = lo & 127 | 128;
        lo = (lo >>> 7 | hi << 25) >>> 0;
        hi >>>= 7;
      }
      while (lo > 127) {
        buf[pos++] = lo & 127 | 128;
        lo = lo >>> 7;
      }
      buf[pos] = lo;
      return pos + 1;
    }
    Writer.prototype.uint64 = function write_uint64(value) {
      var bits = LongBits.from(value);
      this._reserve(10);
      var pos = this.pos;
      this.pos = writeVarint64(bits, this.buf, pos);
      return this;
    };
    Writer.prototype.int64 = Writer.prototype.uint64;
    Writer.prototype.sint64 = function write_sint64(value) {
      var bits = LongBits.from(value).zzEncode();
      this._reserve(10);
      var pos = this.pos;
      this.pos = writeVarint64(bits, this.buf, pos);
      return this;
    };
    Writer.prototype.bool = function write_bool(value) {
      this._reserve(1);
      this.buf[this.pos++] = value ? 1 : 0;
      return this;
    };
    function writeFixed32(val, buf, pos) {
      buf[pos] = val & 255;
      buf[pos + 1] = val >>> 8 & 255;
      buf[pos + 2] = val >>> 16 & 255;
      buf[pos + 3] = val >>> 24;
    }
    Writer.prototype.fixed32 = function write_fixed32(value) {
      this._reserve(4);
      writeFixed32(value >>> 0, this.buf, this.pos);
      this.pos += 4;
      return this;
    };
    Writer.prototype.sfixed32 = Writer.prototype.fixed32;
    Writer.prototype.fixed64 = function write_fixed64(value) {
      var bits = LongBits.from(value);
      this._reserve(8);
      writeFixed32(bits.lo, this.buf, this.pos);
      writeFixed32(bits.hi, this.buf, this.pos + 4);
      this.pos += 8;
      return this;
    };
    Writer.prototype.sfixed64 = Writer.prototype.fixed64;
    Writer.prototype.float = function write_float(value) {
      this._reserve(4);
      util.float.writeFloatLE(value, this.buf, this.pos);
      this.pos += 4;
      return this;
    };
    Writer.prototype.double = function write_double(value) {
      this._reserve(8);
      util.float.writeDoubleLE(value, this.buf, this.pos);
      this.pos += 8;
      return this;
    };
    Writer.prototype.bytes = function write_bytes(value) {
      var len = value.length >>> 0;
      if (!len) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
      }
      this.uint32(len);
      this._reserve(len);
      this.buf.set(value, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype.raw = function write_raw(value) {
      var len = value.length >>> 0;
      if (!len)
        return this;
      this._reserve(len);
      this.buf.set(value, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype._delim = function _delim(pos, len) {
      var n = sizeVarint32(len);
      if (n > 1)
        this.buf.copyWithin(pos + n, pos + 1, pos + 1 + len);
      writeVarint32(len, this.buf, pos);
      this.pos = pos + n + len;
      return this;
    };
    Writer.prototype.string = function write_string(value) {
      var n = value.length;
      if (!n) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (n < 128) {
        this._reserve(n * 3 + 5);
        var lenPos = this.pos;
        return this._delim(lenPos, utf8.write(value, this.buf, lenPos + 1));
      }
      var len = utf8.length(value);
      this.uint32(len);
      this._reserve(len);
      if (len === value.length)
        writeStringAscii(value, this.buf, this.pos);
      else
        utf8.write(value, this.buf, this.pos);
      this.pos += len;
      return this;
    };
    Writer.prototype.uint32s = function write_uint32s(value) {
      var n = value.length;
      this._reserve(n * 5 + 5);
      var buf = this.buf, lenPos = this.pos, p = lenPos + 1;
      for (var i = 0; i < n; ++i)
        p = writeVarint32(value[i] >>> 0, buf, p);
      return this._delim(lenPos, p - lenPos - 1);
    };
    Writer.prototype.int32s = function write_int32s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1, val;
      for (var i = 0; i < n; ++i) {
        if ((val = value[i] | 0) < 0) {
          pos = writeVarint64(LongBits.fromNumber(val), buf, pos);
        } else {
          pos = writeVarint32(val, buf, pos);
        }
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.sint32s = function write_sint32s(value) {
      var n = value.length;
      this._reserve(n * 5 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i)
        pos = writeVarint32((value[i] << 1 ^ value[i] >> 31) >>> 0, buf, pos);
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.uint64s = function write_uint64s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i) {
        pos = writeVarint64(LongBits.from(value[i]), buf, pos);
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.int64s = Writer.prototype.uint64s;
    Writer.prototype.sint64s = function write_sint64s(value) {
      var n = value.length;
      this._reserve(n * 10 + 5);
      var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
      for (var i = 0; i < n; ++i) {
        pos = writeVarint64(LongBits.from(value[i]).zzEncode(), buf, pos);
      }
      return this._delim(lenPos, pos - lenPos - 1);
    };
    Writer.prototype.bools = function write_bools(value) {
      var n = value.length;
      this.uint32(n);
      this._reserve(n);
      var buf = this.buf, p = this.pos;
      for (var i = 0; i < n; ++i)
        buf[p++] = value[i] ? 1 : 0;
      this.pos += n;
      return this;
    };
    var VIEW_THRESHOLD_FLOAT = 16;
    var VIEW_THRESHOLD_INT = 128;
    function getLazyView(writer, count, threshold) {
      var view = writer.view;
      if (view || count < threshold)
        return view;
      var buf = writer.buf;
      return writer.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    Writer.prototype.fixed32s = function write_fixed32s(value) {
      var n = value.length, bytes = n * 4;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setUint32(p, value[i] >>> 0, true);
          p += 4;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          writeFixed32(value[i] >>> 0, buf, p);
          p += 4;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.sfixed32s = Writer.prototype.fixed32s;
    Writer.prototype.fixed64s = function write_fixed64s(value) {
      var n = value.length, bytes = n * 8;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, bits, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
      if (dv)
        for (i = 0; i < n; ++i) {
          bits = LongBits.from(value[i]);
          dv.setUint32(p, bits.lo, true);
          dv.setUint32(p + 4, bits.hi, true);
          p += 8;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          bits = LongBits.from(value[i]);
          writeFixed32(bits.lo, buf, p);
          writeFixed32(bits.hi, buf, p + 4);
          p += 8;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.sfixed64s = Writer.prototype.fixed64s;
    Writer.prototype.floats = function write_floats(value) {
      var n = value.length, bytes = n * 4;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setFloat32(p, value[i], true);
          p += 4;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          util.float.writeFloatLE(value[i], buf, p);
          p += 4;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.doubles = function write_doubles(value) {
      var n = value.length, bytes = n * 8;
      this.uint32(bytes);
      this._reserve(bytes);
      var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (i = 0; i < n; ++i) {
          dv.setFloat64(p, value[i], true);
          p += 8;
        }
      else {
        var buf = this.buf;
        for (i = 0; i < n; ++i) {
          util.float.writeDoubleLE(value[i], buf, p);
          p += 8;
        }
      }
      this.pos += bytes;
      return this;
    };
    Writer.prototype.fork = function fork() {
      this._reserve(1);
      (this.states || (this.states = [])).push(this.pos);
      this.pos += 1;
      return this;
    };
    Writer.prototype.reset = function reset() {
      var states = this.states;
      if (states && states.length) {
        this.pos = states.pop();
      } else {
        this.pos = 0;
      }
      return this;
    };
    Writer.prototype.ldelim = function ldelim() {
      var states = this.states, len, vlen;
      if (states && states.length) {
        var lenPos = states.pop();
        len = this.pos - lenPos - 1;
        vlen = sizeVarint32(len);
        if (vlen > 1) {
          this._reserve(vlen - 1);
          this.buf.copyWithin(lenPos + vlen, lenPos + 1, lenPos + 1 + len);
          this.pos += vlen - 1;
          writeVarint32(len, this.buf, lenPos);
        } else {
          this.buf[lenPos] = len;
        }
      } else {
        len = this.pos;
        vlen = sizeVarint32(len);
        this._reserve(vlen);
        this.buf.copyWithin(vlen, 0, len);
        writeVarint32(len, this.buf, 0);
        this.pos += vlen;
      }
      return this;
    };
    Writer.prototype.finish = function finish(shared) {
      if (shared)
        return this.buf.subarray(0, this.pos);
      var buf = this.constructor.alloc(this.pos);
      buf.set(this.buf.subarray(0, this.pos), 0);
      return buf;
    };
    Writer.prototype.finishInto = function finishInto(buf, offset) {
      if (offset === void 0)
        offset = 0;
      buf.set(this.buf.subarray(0, this.pos), offset);
      return buf;
    };
    Writer._configure = function(BufferWriter_) {
      BufferWriter = BufferWriter_;
      Writer.create = create();
      BufferWriter._configure();
    };
  }
});

// node_modules/protobufjs/src/writer_buffer.js
var require_writer_buffer = __commonJS({
  "node_modules/protobufjs/src/writer_buffer.js"(exports2, module2) {
    "use strict";
    module2.exports = BufferWriter;
    var Writer = require_writer();
    BufferWriter.prototype = Object.create(Writer.prototype, {
      constructor: {
        value: BufferWriter,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    var util = require_minimal();
    function BufferWriter() {
      Writer.call(this);
    }
    var writeStringBuffer;
    BufferWriter._configure = function() {
      BufferWriter.alloc = util.Buffer && util.Buffer.allocUnsafe;
      writeStringBuffer = util.Buffer && util.Buffer.prototype.utf8Write ? function writeStringBuffer_utf8Write(val, buf, pos) {
        return buf.utf8Write(val, pos);
      } : function writeStringBuffer_write(val, buf, pos) {
        return buf.write(val, pos);
      };
    };
    BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
      if (util.isString(value))
        value = util.Buffer.from(value, "base64");
      var len = value.length >>> 0;
      this.uint32(len);
      if (len) {
        this._reserve(len);
        this.buf.set(value, this.pos);
        this.pos += len;
      }
      return this;
    };
    BufferWriter.prototype.string = function write_string_buffer(value) {
      var n = value.length;
      if (!n) {
        this._reserve(1);
        this.buf[this.pos++] = 0;
        return this;
      }
      if (n < 128) {
        this._reserve(n * 3 + 5);
        var pos = this.pos, buf = this.buf;
        return this._delim(
          pos,
          n < 40 ? util.utf8.write(value, buf, pos + 1) : writeStringBuffer(value, buf, pos + 1)
        );
      }
      var len = util.Buffer.byteLength(value);
      this.uint32(len);
      this._reserve(len);
      writeStringBuffer(value, this.buf, this.pos);
      this.pos += len;
      return this;
    };
    BufferWriter._configure();
  }
});

// node_modules/protobufjs/src/reader.js
var require_reader = __commonJS({
  "node_modules/protobufjs/src/reader.js"(exports2, module2) {
    "use strict";
    module2.exports = Reader;
    var util = require_minimal();
    var BufferReader;
    var LongBits = util.LongBits;
    var utf8 = util.utf8;
    function indexOutOfRange(reader, writeLength) {
      return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
    }
    function Reader(buffer) {
      this.buf = buffer;
      this.pos = 0;
      this.len = buffer.length;
      this.view = null;
      this.discardUnknown = Reader.discardUnknown;
    }
    function create_array(buffer) {
      if (Array.isArray(buffer))
        buffer = new Uint8Array(buffer);
      if (buffer instanceof Uint8Array)
        return new Reader(buffer);
      throw Error("illegal buffer");
    }
    var create = function create2() {
      return util.Buffer ? function create_buffer_setup(buffer) {
        return (Reader.create = function create_buffer(buffer2) {
          return util.Buffer.isBuffer(buffer2) ? new BufferReader(buffer2) : create_array(buffer2);
        })(buffer);
      } : create_array;
    };
    Reader.create = create();
    Reader.prototype.raw = function read_raw(start, end) {
      return this.buf.subarray(start, end);
    };
    function readVarint32NearEnd(reader) {
      var value = 0;
      for (var i = 0; i < 4; ++i) {
        if (reader.pos >= reader.len)
          throw indexOutOfRange(reader);
        var b = reader.buf[reader.pos++];
        value = (value | (b & 127) << i * 7) >>> 0;
        if (b < 128)
          return value;
      }
      throw indexOutOfRange(reader);
    }
    Reader.prototype.uint32 = function read_uint32() {
      if (this.len - this.pos < 5) {
        if (this.pos >= this.len)
          throw indexOutOfRange(this);
        if (this.buf[this.pos] >= 128)
          return readVarint32NearEnd(this);
      }
      var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 7) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 14) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 21) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 15) << 28) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      for (var i = 0; i < 5; ++i) {
        if (pos >= this.len) {
          this.pos = pos;
          throw indexOutOfRange(this);
        }
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
      }
      this.pos = pos;
      throw Error("invalid varint encoding");
    };
    Reader.prototype.tag = function read_tag() {
      if (this.len - this.pos < 5) {
        if (this.pos >= this.len)
          throw indexOutOfRange(this);
        if (this.buf[this.pos] >= 128)
          return readVarint32NearEnd(this);
      }
      var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 7) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 14) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 127) << 21) >>> 0;
      if (buf[pos++] < 128) {
        this.pos = pos;
        return value;
      }
      value = (value | (buf[pos] & 15) << 28) >>> 0;
      if (buf[pos] < 128 && (buf[pos] & 112) === 0) {
        this.pos = pos + 1;
        return value;
      }
      this.pos = pos + 1;
      throw Error("invalid tag encoding");
    };
    Reader.prototype.int32 = function read_int32() {
      return this.uint32() | 0;
    };
    Reader.prototype.sint32 = function read_sint32() {
      var value = this.uint32();
      return value >>> 1 ^ -(value & 1) | 0;
    };
    function readLongVarint() {
      var bits = new LongBits(0, 0);
      var i = 0;
      if (this.len - this.pos > 4) {
        for (; i < 4; ++i) {
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128)
          return bits;
        i = 0;
      } else {
        for (; i < 4; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
        throw indexOutOfRange(this);
      }
      if (this.len - this.pos > 4) {
        for (; i < 5; ++i) {
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      } else {
        for (; i < 5; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
        }
      }
      throw Error("invalid varint encoding");
    }
    Reader.prototype.bool = function read_bool() {
      var value = false, b;
      for (var i = 0; i < 10; ++i) {
        if (this.pos >= this.len)
          throw indexOutOfRange(this);
        b = this.buf[this.pos++];
        if (b & 127)
          value = true;
        if (b < 128)
          return value;
      }
      throw Error("invalid varint encoding");
    };
    function readFixed32_end(buf, end) {
      return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
    }
    Reader.prototype.fixed32 = function read_fixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4);
    };
    Reader.prototype.sfixed32 = function read_sfixed32() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      return readFixed32_end(this.buf, this.pos += 4) | 0;
    };
    function readFixed64() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);
      return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
    }
    Reader.prototype.float = function read_float() {
      if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readFloatLE(this.buf, this.pos);
      this.pos += 4;
      return value;
    };
    Reader.prototype.double = function read_double() {
      if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);
      var value = util.float.readDoubleLE(this.buf, this.pos);
      this.pos += 8;
      return value;
    };
    Reader.prototype.uint32s = function read_uint32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (pos < end) {
        value = buf[pos++];
        if (value < 128)
          array.push(value);
        else {
          this.pos = pos - 1;
          array.push(this.uint32());
          pos = this.pos;
        }
      }
      this.pos = pos;
      if (pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.int32s = function read_int32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (pos < end) {
        value = buf[pos++];
        if (value < 128)
          array.push(value);
        else {
          this.pos = pos - 1;
          array.push(this.int32());
          pos = this.pos;
        }
      }
      this.pos = pos;
      if (pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.sint32s = function read_sint32s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (this.pos < end)
        array.push(this.sint32());
      if (this.pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.bools = function read_bools(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (pos < end) {
        value = buf[pos++];
        if (value < 128)
          array.push(value !== 0);
        else {
          this.pos = pos - 1;
          array.push(this.bool());
          pos = this.pos;
        }
      }
      this.pos = pos;
      if (pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    var VIEW_THRESHOLD_FLOAT = 8;
    var VIEW_THRESHOLD_INT = 128;
    function getLazyView(reader, count, threshold) {
      var view = reader.view;
      if (view || count < threshold)
        return view;
      var buf = reader.buf;
      return reader.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    }
    Reader.prototype.fixed32s = function read_fixed32s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getUint32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.sfixed32s = function read_sfixed32s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getInt32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4) | 0;
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.floats = function read_floats(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 2, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getFloat32(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 4) array[i++] = util.float.readFloatLE(buf, pos);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 4);
      return array;
    };
    Reader.prototype.doubles = function read_doubles(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3, i = array.length, pos = this.pos;
      array.length = i + count;
      var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
      if (dv)
        for (var k = 0; k < count; ++k, pos += 8) array[i++] = dv.getFloat64(pos, true);
      else {
        var buf = this.buf;
        for (var j = 0; j < count; ++j, pos += 8) array[i++] = util.float.readDoubleLE(buf, pos);
      }
      this.pos = pos;
      if (pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.uint64s = function read_uint64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (this.pos < end)
        array.push(this.uint64());
      if (this.pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.int64s = function read_int64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (this.pos < end)
        array.push(this.int64());
      if (this.pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.sint64s = function read_sint64s(array) {
      if (array === void 0) array = [];
      var end = this.uint32() + this.pos, len = this.len;
      if (end > len) throw indexOutOfRange(this, end - this.pos);
      this.len = end;
      while (this.pos < end)
        array.push(this.sint64());
      if (this.pos !== end) throw RangeError("index out of range");
      this.len = len;
      return array;
    };
    Reader.prototype.fixed64s = function read_fixed64s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len, i = array.length;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3;
      array.length = i + count;
      for (var j = 0; j < count; ++j)
        array[i++] = this.fixed64();
      if (this.pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.sfixed64s = function read_sfixed64s(array) {
      if (array === void 0) array = [];
      var len = this.uint32(), end = this.pos + len, i = array.length;
      if (end > this.len) throw indexOutOfRange(this, len);
      var count = len >>> 3;
      array.length = i + count;
      for (var j = 0; j < count; ++j)
        array[i++] = this.sfixed64();
      if (this.pos !== end) throw indexOutOfRange(this, 8);
      return array;
    };
    Reader.prototype.bytes = function read_bytes() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return this.raw(start, end);
    };
    Reader.prototype.string = function read_string() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return utf8.read(this.buf, start, end);
    };
    Reader.prototype.stringVerify = function read_string_verify() {
      var length = this.uint32(), start = this.pos, end = this.pos + length;
      if (end > this.len)
        throw indexOutOfRange(this, length);
      this.pos = end;
      return utf8.readStrict(this.buf, start, end);
    };
    Reader.prototype.skip = function skip(length) {
      if (typeof length === "number") {
        if (this.pos + length > this.len)
          throw indexOutOfRange(this, length);
        this.pos += length;
      } else {
        do {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
      }
      return this;
    };
    Reader.recursionLimit = util.recursionLimit;
    Reader.discardUnknown = true;
    Reader.prototype.skipType = function(wireType, depth, fieldNumber) {
      if (depth === void 0) depth = 0;
      if (depth > Reader.recursionLimit)
        throw Error("max depth exceeded");
      if (fieldNumber === 0)
        throw Error("illegal tag: field number 0");
      switch (wireType) {
        case 0:
          this.skip();
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          while (true) {
            var tag = this.tag();
            var nestedField = tag >>> 3;
            wireType = tag & 7;
            if (!nestedField)
              throw Error("illegal tag: field number 0");
            if (wireType === 4) {
              if (fieldNumber !== void 0 && nestedField !== fieldNumber)
                throw Error("invalid end group tag");
              break;
            }
            this.skipType(wireType, depth + 1, nestedField);
          }
          break;
        case 5:
          this.skip(4);
          break;
        /* istanbul ignore next */
        default:
          throw Error("invalid wire type " + wireType + " at offset " + this.pos);
      }
      return this;
    };
    Reader._configure = function(BufferReader_) {
      BufferReader = BufferReader_;
      Reader.create = create();
      BufferReader._configure();
      var fn = util.Long ? "toLong" : (
        /* istanbul ignore next */
        "toNumber"
      );
      util.merge(Reader.prototype, {
        int64: function read_int64() {
          return readLongVarint.call(this)[fn](false);
        },
        uint64: function read_uint64() {
          return readLongVarint.call(this)[fn](true);
        },
        sint64: function read_sint64() {
          return readLongVarint.call(this).zzDecode()[fn](false);
        },
        fixed64: function read_fixed64() {
          return readFixed64.call(this)[fn](true);
        },
        sfixed64: function read_sfixed64() {
          return readFixed64.call(this)[fn](false);
        }
      });
    };
  }
});

// node_modules/protobufjs/src/reader_buffer.js
var require_reader_buffer = __commonJS({
  "node_modules/protobufjs/src/reader_buffer.js"(exports2, module2) {
    "use strict";
    module2.exports = BufferReader;
    var Reader = require_reader();
    BufferReader.prototype = Object.create(Reader.prototype, {
      constructor: {
        value: BufferReader,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    var util = require_minimal();
    function BufferReader(buffer) {
      Reader.call(this, buffer);
    }
    BufferReader._configure = function() {
      if (util.Buffer)
        BufferReader.prototype._slice = util.Buffer.prototype.slice;
    };
    BufferReader.prototype.raw = function read_raw_buffer(start, end) {
      return this._slice.call(this.buf, start, end);
    };
    BufferReader.prototype.string = function read_string_buffer() {
      var len = this.uint32(), start = this.pos, end = this.pos + len;
      if (end > this.len)
        throw RangeError("index out of range: " + this.pos + " + " + len + " > " + this.len);
      this.pos = end;
      return this.buf.utf8Slice ? this.buf.utf8Slice(start, end) : this.buf.toString("utf-8", start, end);
    };
    BufferReader._configure();
  }
});

// node_modules/protobufjs/src/rpc/service.js
var require_service = __commonJS({
  "node_modules/protobufjs/src/rpc/service.js"(exports2, module2) {
    "use strict";
    module2.exports = Service;
    var util = require_minimal();
    Service.prototype = Object.create(util.EventEmitter.prototype, {
      constructor: {
        value: Service,
        writable: true,
        enumerable: false,
        configurable: true
      }
    });
    function Service(rpcImpl, requestDelimited, responseDelimited) {
      if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");
      util.EventEmitter.call(this);
      this.rpcImpl = rpcImpl;
      this.requestDelimited = Boolean(requestDelimited);
      this.responseDelimited = Boolean(responseDelimited);
    }
    Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
      if (!request)
        throw TypeError("request must be specified");
      var self2 = this;
      if (!callback)
        return util.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
      if (!self2.rpcImpl) {
        setTimeout(function() {
          callback(Error("already ended"));
        }, 0);
        return void 0;
      }
      try {
        return self2.rpcImpl(
          method,
          requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
          function rpcCallback(err, response) {
            if (err) {
              self2.emit("error", err, method);
              return callback(err);
            }
            if (response === null) {
              self2.end(
                /* endedByRPC */
                true
              );
              return void 0;
            }
            if (!(response instanceof responseCtor)) {
              try {
                response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
              } catch (err2) {
                self2.emit("error", err2, method);
                return callback(err2);
              }
            }
            self2.emit("data", response, method);
            return callback(null, response);
          }
        );
      } catch (err) {
        self2.emit("error", err, method);
        setTimeout(function() {
          callback(err);
        }, 0);
        return void 0;
      }
    };
    Service.prototype.end = function end(endedByRPC) {
      if (this.rpcImpl) {
        if (!endedByRPC)
          this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
      }
      return this;
    };
  }
});

// node_modules/protobufjs/src/rpc.js
var require_rpc = __commonJS({
  "node_modules/protobufjs/src/rpc.js"(exports2) {
    "use strict";
    var rpc = exports2;
    rpc.Service = require_service();
  }
});

// node_modules/protobufjs/src/roots.js
var require_roots = __commonJS({
  "node_modules/protobufjs/src/roots.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ Object.create(null);
  }
});

// node_modules/protobufjs/src/index-minimal.js
var require_index_minimal = __commonJS({
  "node_modules/protobufjs/src/index-minimal.js"(exports2) {
    "use strict";
    exports2.build = "minimal";
    exports2.Writer = require_writer();
    exports2.BufferWriter = require_writer_buffer();
    exports2.Reader = require_reader();
    exports2.BufferReader = require_reader_buffer();
    exports2.util = require_minimal();
    exports2.rpc = require_rpc();
    exports2.roots = require_roots();
    exports2.configure = configure;
    function configure() {
      exports2.util.LongBits._configure(exports2.util.Long);
      exports2.Writer._configure(exports2.BufferWriter);
      exports2.Reader._configure(exports2.BufferReader);
    }
    configure();
  }
});

// node_modules/protobufjs/minimal.js
var require_minimal2 = __commonJS({
  "node_modules/protobufjs/minimal.js"(exports2, module2) {
    "use strict";
    module2.exports = require_index_minimal();
  }
});

// node_modules/gtfs-realtime-bindings/gtfs-realtime.js
var require_gtfs_realtime = __commonJS({
  "node_modules/gtfs-realtime-bindings/gtfs-realtime.js"(exports2, module2) {
    "use strict";
    var $protobuf = require_minimal2();
    var $Reader = $protobuf.Reader;
    var $Writer = $protobuf.Writer;
    var $util = $protobuf.util;
    var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
    $root.transit_realtime = (function() {
      var transit_realtime2 = {};
      transit_realtime2.FeedMessage = (function() {
        function FeedMessage(properties) {
          this.entity = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        FeedMessage.prototype.header = null;
        FeedMessage.prototype.entity = $util.emptyArray;
        FeedMessage.create = function create(properties) {
          return new FeedMessage(properties);
        };
        FeedMessage.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          $root.transit_realtime.FeedHeader.encode(message.header, writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).fork()).ldelim();
          if (message.entity != null && message.entity.length)
            for (var i = 0; i < message.entity.length; ++i)
              $root.transit_realtime.FeedEntity.encode(message.entity[i], writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        FeedMessage.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        FeedMessage.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.FeedMessage();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.header = $root.transit_realtime.FeedHeader.decode(reader, reader.uint32(), void 0, _depth + 1, message.header);
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if (!(message.entity && message.entity.length))
                  message.entity = [];
                message.entity.push($root.transit_realtime.FeedEntity.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          if (!message.hasOwnProperty("header"))
            throw $util.ProtocolError("missing required 'header'", { instance: message });
          return message;
        };
        FeedMessage.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        FeedMessage.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          {
            var error = $root.transit_realtime.FeedHeader.verify(message.header, _depth + 1);
            if (error)
              return "header." + error;
          }
          if (message.entity != null && message.hasOwnProperty("entity")) {
            if (!Array.isArray(message.entity))
              return "entity: array expected";
            for (var i = 0; i < message.entity.length; ++i) {
              var error = $root.transit_realtime.FeedEntity.verify(message.entity[i], _depth + 1);
              if (error)
                return "entity." + error;
            }
          }
          return null;
        };
        FeedMessage.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.FeedMessage)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.FeedMessage();
          if (object.header != null) {
            if (typeof object.header !== "object")
              throw TypeError(".transit_realtime.FeedMessage.header: object expected");
            message.header = $root.transit_realtime.FeedHeader.fromObject(object.header, _depth + 1);
          }
          if (object.entity) {
            if (!Array.isArray(object.entity))
              throw TypeError(".transit_realtime.FeedMessage.entity: array expected");
            message.entity = Array(object.entity.length);
            for (var i = 0; i < object.entity.length; ++i) {
              if (typeof object.entity[i] !== "object")
                throw TypeError(".transit_realtime.FeedMessage.entity: object expected");
              message.entity[i] = $root.transit_realtime.FeedEntity.fromObject(object.entity[i], _depth + 1);
            }
          }
          return message;
        };
        FeedMessage.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults)
            object.entity = [];
          if (options.defaults)
            object.header = null;
          if (message.header != null && message.hasOwnProperty("header"))
            object.header = $root.transit_realtime.FeedHeader.toObject(message.header, options);
          if (message.entity && message.entity.length) {
            object.entity = Array(message.entity.length);
            for (var j = 0; j < message.entity.length; ++j)
              object.entity[j] = $root.transit_realtime.FeedEntity.toObject(message.entity[j], options);
          }
          return object;
        };
        FeedMessage.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        FeedMessage.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.FeedMessage";
        };
        return FeedMessage;
      })();
      transit_realtime2.FeedHeader = (function() {
        function FeedHeader(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        FeedHeader.prototype.gtfsRealtimeVersion = "";
        FeedHeader.prototype.incrementality = 0;
        FeedHeader.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
        FeedHeader.prototype.feedVersion = "";
        FeedHeader.create = function create(properties) {
          return new FeedHeader(properties);
        };
        FeedHeader.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.gtfsRealtimeVersion);
          if (message.incrementality != null && Object.hasOwnProperty.call(message, "incrementality"))
            writer.uint32(
              /* id 2, wireType 0 =*/
              16
            ).int32(message.incrementality);
          if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
            writer.uint32(
              /* id 3, wireType 0 =*/
              24
            ).uint64(message.timestamp);
          if (message.feedVersion != null && Object.hasOwnProperty.call(message, "feedVersion"))
            writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).string(message.feedVersion);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        FeedHeader.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        FeedHeader.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.FeedHeader();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.gtfsRealtimeVersion = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 0)
                  break;
                message.incrementality = reader.int32();
                continue;
              }
              case 3: {
                if (wireType !== 0)
                  break;
                message.timestamp = reader.uint64();
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                message.feedVersion = reader.string();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          if (!message.hasOwnProperty("gtfsRealtimeVersion"))
            throw $util.ProtocolError("missing required 'gtfsRealtimeVersion'", { instance: message });
          return message;
        };
        FeedHeader.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        FeedHeader.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (!$util.isString(message.gtfsRealtimeVersion))
            return "gtfsRealtimeVersion: string expected";
          if (message.incrementality != null && message.hasOwnProperty("incrementality"))
            switch (message.incrementality) {
              default:
                return "incrementality: enum value expected";
              case 0:
              case 1:
                break;
            }
          if (message.timestamp != null && message.hasOwnProperty("timestamp")) {
            if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
              return "timestamp: integer|Long expected";
          }
          if (message.feedVersion != null && message.hasOwnProperty("feedVersion")) {
            if (!$util.isString(message.feedVersion))
              return "feedVersion: string expected";
          }
          return null;
        };
        FeedHeader.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.FeedHeader)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.FeedHeader();
          if (object.gtfsRealtimeVersion != null)
            message.gtfsRealtimeVersion = String(object.gtfsRealtimeVersion);
          switch (object.incrementality) {
            default:
              if (typeof object.incrementality === "number") {
                message.incrementality = object.incrementality;
                break;
              }
              break;
            case "FULL_DATASET":
            case 0:
              message.incrementality = 0;
              break;
            case "DIFFERENTIAL":
            case 1:
              message.incrementality = 1;
              break;
          }
          if (object.timestamp != null) {
            if ($util.Long)
              (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
            else if (typeof object.timestamp === "string")
              message.timestamp = parseInt(object.timestamp, 10);
            else if (typeof object.timestamp === "number")
              message.timestamp = object.timestamp;
            else if (typeof object.timestamp === "object")
              message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
          }
          if (object.feedVersion != null)
            message.feedVersion = String(object.feedVersion);
          return message;
        };
        FeedHeader.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.gtfsRealtimeVersion = "";
            object.incrementality = options.enums === String ? "FULL_DATASET" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
              object.timestamp = options.longs === String ? "0" : 0;
            object.feedVersion = "";
          }
          if (message.gtfsRealtimeVersion != null && message.hasOwnProperty("gtfsRealtimeVersion"))
            object.gtfsRealtimeVersion = message.gtfsRealtimeVersion;
          if (message.incrementality != null && message.hasOwnProperty("incrementality"))
            object.incrementality = options.enums === String ? $root.transit_realtime.FeedHeader.Incrementality[message.incrementality] === void 0 ? message.incrementality : $root.transit_realtime.FeedHeader.Incrementality[message.incrementality] : message.incrementality;
          if (message.timestamp != null && message.hasOwnProperty("timestamp"))
            if (typeof message.timestamp === "number")
              object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
            else
              object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
          if (message.feedVersion != null && message.hasOwnProperty("feedVersion"))
            object.feedVersion = message.feedVersion;
          return object;
        };
        FeedHeader.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        FeedHeader.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.FeedHeader";
        };
        FeedHeader.Incrementality = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "FULL_DATASET"] = 0;
          values[valuesById[1] = "DIFFERENTIAL"] = 1;
          return values;
        })();
        return FeedHeader;
      })();
      transit_realtime2.FeedEntity = (function() {
        function FeedEntity(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        FeedEntity.prototype.id = "";
        FeedEntity.prototype.isDeleted = false;
        FeedEntity.prototype.tripUpdate = null;
        FeedEntity.prototype.vehicle = null;
        FeedEntity.prototype.alert = null;
        FeedEntity.prototype.shape = null;
        FeedEntity.prototype.stop = null;
        FeedEntity.prototype.tripModifications = null;
        FeedEntity.create = function create(properties) {
          return new FeedEntity(properties);
        };
        FeedEntity.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.id);
          if (message.isDeleted != null && Object.hasOwnProperty.call(message, "isDeleted"))
            writer.uint32(
              /* id 2, wireType 0 =*/
              16
            ).bool(message.isDeleted);
          if (message.tripUpdate != null && Object.hasOwnProperty.call(message, "tripUpdate"))
            $root.transit_realtime.TripUpdate.encode(message.tripUpdate, writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).fork()).ldelim();
          if (message.vehicle != null && Object.hasOwnProperty.call(message, "vehicle"))
            $root.transit_realtime.VehiclePosition.encode(message.vehicle, writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).fork()).ldelim();
          if (message.alert != null && Object.hasOwnProperty.call(message, "alert"))
            $root.transit_realtime.Alert.encode(message.alert, writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).fork()).ldelim();
          if (message.shape != null && Object.hasOwnProperty.call(message, "shape"))
            $root.transit_realtime.Shape.encode(message.shape, writer.uint32(
              /* id 6, wireType 2 =*/
              50
            ).fork()).ldelim();
          if (message.stop != null && Object.hasOwnProperty.call(message, "stop"))
            $root.transit_realtime.Stop.encode(message.stop, writer.uint32(
              /* id 7, wireType 2 =*/
              58
            ).fork()).ldelim();
          if (message.tripModifications != null && Object.hasOwnProperty.call(message, "tripModifications"))
            $root.transit_realtime.TripModifications.encode(message.tripModifications, writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        FeedEntity.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        FeedEntity.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.FeedEntity();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.id = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 0)
                  break;
                message.isDeleted = reader.bool();
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                message.tripUpdate = $root.transit_realtime.TripUpdate.decode(reader, reader.uint32(), void 0, _depth + 1, message.tripUpdate);
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                message.vehicle = $root.transit_realtime.VehiclePosition.decode(reader, reader.uint32(), void 0, _depth + 1, message.vehicle);
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                message.alert = $root.transit_realtime.Alert.decode(reader, reader.uint32(), void 0, _depth + 1, message.alert);
                continue;
              }
              case 6: {
                if (wireType !== 2)
                  break;
                message.shape = $root.transit_realtime.Shape.decode(reader, reader.uint32(), void 0, _depth + 1, message.shape);
                continue;
              }
              case 7: {
                if (wireType !== 2)
                  break;
                message.stop = $root.transit_realtime.Stop.decode(reader, reader.uint32(), void 0, _depth + 1, message.stop);
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                message.tripModifications = $root.transit_realtime.TripModifications.decode(reader, reader.uint32(), void 0, _depth + 1, message.tripModifications);
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          if (!message.hasOwnProperty("id"))
            throw $util.ProtocolError("missing required 'id'", { instance: message });
          return message;
        };
        FeedEntity.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        FeedEntity.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (!$util.isString(message.id))
            return "id: string expected";
          if (message.isDeleted != null && message.hasOwnProperty("isDeleted")) {
            if (typeof message.isDeleted !== "boolean")
              return "isDeleted: boolean expected";
          }
          if (message.tripUpdate != null && message.hasOwnProperty("tripUpdate")) {
            var error = $root.transit_realtime.TripUpdate.verify(message.tripUpdate, _depth + 1);
            if (error)
              return "tripUpdate." + error;
          }
          if (message.vehicle != null && message.hasOwnProperty("vehicle")) {
            var error = $root.transit_realtime.VehiclePosition.verify(message.vehicle, _depth + 1);
            if (error)
              return "vehicle." + error;
          }
          if (message.alert != null && message.hasOwnProperty("alert")) {
            var error = $root.transit_realtime.Alert.verify(message.alert, _depth + 1);
            if (error)
              return "alert." + error;
          }
          if (message.shape != null && message.hasOwnProperty("shape")) {
            var error = $root.transit_realtime.Shape.verify(message.shape, _depth + 1);
            if (error)
              return "shape." + error;
          }
          if (message.stop != null && message.hasOwnProperty("stop")) {
            var error = $root.transit_realtime.Stop.verify(message.stop, _depth + 1);
            if (error)
              return "stop." + error;
          }
          if (message.tripModifications != null && message.hasOwnProperty("tripModifications")) {
            var error = $root.transit_realtime.TripModifications.verify(message.tripModifications, _depth + 1);
            if (error)
              return "tripModifications." + error;
          }
          return null;
        };
        FeedEntity.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.FeedEntity)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.FeedEntity();
          if (object.id != null)
            message.id = String(object.id);
          if (object.isDeleted != null)
            message.isDeleted = Boolean(object.isDeleted);
          if (object.tripUpdate != null) {
            if (typeof object.tripUpdate !== "object")
              throw TypeError(".transit_realtime.FeedEntity.tripUpdate: object expected");
            message.tripUpdate = $root.transit_realtime.TripUpdate.fromObject(object.tripUpdate, _depth + 1);
          }
          if (object.vehicle != null) {
            if (typeof object.vehicle !== "object")
              throw TypeError(".transit_realtime.FeedEntity.vehicle: object expected");
            message.vehicle = $root.transit_realtime.VehiclePosition.fromObject(object.vehicle, _depth + 1);
          }
          if (object.alert != null) {
            if (typeof object.alert !== "object")
              throw TypeError(".transit_realtime.FeedEntity.alert: object expected");
            message.alert = $root.transit_realtime.Alert.fromObject(object.alert, _depth + 1);
          }
          if (object.shape != null) {
            if (typeof object.shape !== "object")
              throw TypeError(".transit_realtime.FeedEntity.shape: object expected");
            message.shape = $root.transit_realtime.Shape.fromObject(object.shape, _depth + 1);
          }
          if (object.stop != null) {
            if (typeof object.stop !== "object")
              throw TypeError(".transit_realtime.FeedEntity.stop: object expected");
            message.stop = $root.transit_realtime.Stop.fromObject(object.stop, _depth + 1);
          }
          if (object.tripModifications != null) {
            if (typeof object.tripModifications !== "object")
              throw TypeError(".transit_realtime.FeedEntity.tripModifications: object expected");
            message.tripModifications = $root.transit_realtime.TripModifications.fromObject(object.tripModifications, _depth + 1);
          }
          return message;
        };
        FeedEntity.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.id = "";
            object.isDeleted = false;
            object.tripUpdate = null;
            object.vehicle = null;
            object.alert = null;
            object.shape = null;
            object.stop = null;
            object.tripModifications = null;
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
          if (message.isDeleted != null && message.hasOwnProperty("isDeleted"))
            object.isDeleted = message.isDeleted;
          if (message.tripUpdate != null && message.hasOwnProperty("tripUpdate"))
            object.tripUpdate = $root.transit_realtime.TripUpdate.toObject(message.tripUpdate, options);
          if (message.vehicle != null && message.hasOwnProperty("vehicle"))
            object.vehicle = $root.transit_realtime.VehiclePosition.toObject(message.vehicle, options);
          if (message.alert != null && message.hasOwnProperty("alert"))
            object.alert = $root.transit_realtime.Alert.toObject(message.alert, options);
          if (message.shape != null && message.hasOwnProperty("shape"))
            object.shape = $root.transit_realtime.Shape.toObject(message.shape, options);
          if (message.stop != null && message.hasOwnProperty("stop"))
            object.stop = $root.transit_realtime.Stop.toObject(message.stop, options);
          if (message.tripModifications != null && message.hasOwnProperty("tripModifications"))
            object.tripModifications = $root.transit_realtime.TripModifications.toObject(message.tripModifications, options);
          return object;
        };
        FeedEntity.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        FeedEntity.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.FeedEntity";
        };
        return FeedEntity;
      })();
      transit_realtime2.TripUpdate = (function() {
        function TripUpdate(properties) {
          this.stopTimeUpdate = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TripUpdate.prototype.trip = null;
        TripUpdate.prototype.vehicle = null;
        TripUpdate.prototype.stopTimeUpdate = $util.emptyArray;
        TripUpdate.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
        TripUpdate.prototype.delay = 0;
        TripUpdate.prototype.tripProperties = null;
        TripUpdate.create = function create(properties) {
          return new TripUpdate(properties);
        };
        TripUpdate.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          $root.transit_realtime.TripDescriptor.encode(message.trip, writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).fork()).ldelim();
          if (message.stopTimeUpdate != null && message.stopTimeUpdate.length)
            for (var i = 0; i < message.stopTimeUpdate.length; ++i)
              $root.transit_realtime.TripUpdate.StopTimeUpdate.encode(message.stopTimeUpdate[i], writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).fork()).ldelim();
          if (message.vehicle != null && Object.hasOwnProperty.call(message, "vehicle"))
            $root.transit_realtime.VehicleDescriptor.encode(message.vehicle, writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).fork()).ldelim();
          if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
            writer.uint32(
              /* id 4, wireType 0 =*/
              32
            ).uint64(message.timestamp);
          if (message.delay != null && Object.hasOwnProperty.call(message, "delay"))
            writer.uint32(
              /* id 5, wireType 0 =*/
              40
            ).int32(message.delay);
          if (message.tripProperties != null && Object.hasOwnProperty.call(message, "tripProperties"))
            $root.transit_realtime.TripUpdate.TripProperties.encode(message.tripProperties, writer.uint32(
              /* id 6, wireType 2 =*/
              50
            ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TripUpdate.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TripUpdate.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripUpdate();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.trip = $root.transit_realtime.TripDescriptor.decode(reader, reader.uint32(), void 0, _depth + 1, message.trip);
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                message.vehicle = $root.transit_realtime.VehicleDescriptor.decode(reader, reader.uint32(), void 0, _depth + 1, message.vehicle);
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if (!(message.stopTimeUpdate && message.stopTimeUpdate.length))
                  message.stopTimeUpdate = [];
                message.stopTimeUpdate.push($root.transit_realtime.TripUpdate.StopTimeUpdate.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 4: {
                if (wireType !== 0)
                  break;
                message.timestamp = reader.uint64();
                continue;
              }
              case 5: {
                if (wireType !== 0)
                  break;
                message.delay = reader.int32();
                continue;
              }
              case 6: {
                if (wireType !== 2)
                  break;
                message.tripProperties = $root.transit_realtime.TripUpdate.TripProperties.decode(reader, reader.uint32(), void 0, _depth + 1, message.tripProperties);
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          if (!message.hasOwnProperty("trip"))
            throw $util.ProtocolError("missing required 'trip'", { instance: message });
          return message;
        };
        TripUpdate.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TripUpdate.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          {
            var error = $root.transit_realtime.TripDescriptor.verify(message.trip, _depth + 1);
            if (error)
              return "trip." + error;
          }
          if (message.vehicle != null && message.hasOwnProperty("vehicle")) {
            var error = $root.transit_realtime.VehicleDescriptor.verify(message.vehicle, _depth + 1);
            if (error)
              return "vehicle." + error;
          }
          if (message.stopTimeUpdate != null && message.hasOwnProperty("stopTimeUpdate")) {
            if (!Array.isArray(message.stopTimeUpdate))
              return "stopTimeUpdate: array expected";
            for (var i = 0; i < message.stopTimeUpdate.length; ++i) {
              var error = $root.transit_realtime.TripUpdate.StopTimeUpdate.verify(message.stopTimeUpdate[i], _depth + 1);
              if (error)
                return "stopTimeUpdate." + error;
            }
          }
          if (message.timestamp != null && message.hasOwnProperty("timestamp")) {
            if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
              return "timestamp: integer|Long expected";
          }
          if (message.delay != null && message.hasOwnProperty("delay")) {
            if (!$util.isInteger(message.delay))
              return "delay: integer expected";
          }
          if (message.tripProperties != null && message.hasOwnProperty("tripProperties")) {
            var error = $root.transit_realtime.TripUpdate.TripProperties.verify(message.tripProperties, _depth + 1);
            if (error)
              return "tripProperties." + error;
          }
          return null;
        };
        TripUpdate.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TripUpdate)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TripUpdate();
          if (object.trip != null) {
            if (typeof object.trip !== "object")
              throw TypeError(".transit_realtime.TripUpdate.trip: object expected");
            message.trip = $root.transit_realtime.TripDescriptor.fromObject(object.trip, _depth + 1);
          }
          if (object.vehicle != null) {
            if (typeof object.vehicle !== "object")
              throw TypeError(".transit_realtime.TripUpdate.vehicle: object expected");
            message.vehicle = $root.transit_realtime.VehicleDescriptor.fromObject(object.vehicle, _depth + 1);
          }
          if (object.stopTimeUpdate) {
            if (!Array.isArray(object.stopTimeUpdate))
              throw TypeError(".transit_realtime.TripUpdate.stopTimeUpdate: array expected");
            message.stopTimeUpdate = Array(object.stopTimeUpdate.length);
            for (var i = 0; i < object.stopTimeUpdate.length; ++i) {
              if (typeof object.stopTimeUpdate[i] !== "object")
                throw TypeError(".transit_realtime.TripUpdate.stopTimeUpdate: object expected");
              message.stopTimeUpdate[i] = $root.transit_realtime.TripUpdate.StopTimeUpdate.fromObject(object.stopTimeUpdate[i], _depth + 1);
            }
          }
          if (object.timestamp != null) {
            if ($util.Long)
              (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
            else if (typeof object.timestamp === "string")
              message.timestamp = parseInt(object.timestamp, 10);
            else if (typeof object.timestamp === "number")
              message.timestamp = object.timestamp;
            else if (typeof object.timestamp === "object")
              message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
          }
          if (object.delay != null)
            message.delay = object.delay | 0;
          if (object.tripProperties != null) {
            if (typeof object.tripProperties !== "object")
              throw TypeError(".transit_realtime.TripUpdate.tripProperties: object expected");
            message.tripProperties = $root.transit_realtime.TripUpdate.TripProperties.fromObject(object.tripProperties, _depth + 1);
          }
          return message;
        };
        TripUpdate.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults)
            object.stopTimeUpdate = [];
          if (options.defaults) {
            object.trip = null;
            object.vehicle = null;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
              object.timestamp = options.longs === String ? "0" : 0;
            object.delay = 0;
            object.tripProperties = null;
          }
          if (message.trip != null && message.hasOwnProperty("trip"))
            object.trip = $root.transit_realtime.TripDescriptor.toObject(message.trip, options);
          if (message.stopTimeUpdate && message.stopTimeUpdate.length) {
            object.stopTimeUpdate = Array(message.stopTimeUpdate.length);
            for (var j = 0; j < message.stopTimeUpdate.length; ++j)
              object.stopTimeUpdate[j] = $root.transit_realtime.TripUpdate.StopTimeUpdate.toObject(message.stopTimeUpdate[j], options);
          }
          if (message.vehicle != null && message.hasOwnProperty("vehicle"))
            object.vehicle = $root.transit_realtime.VehicleDescriptor.toObject(message.vehicle, options);
          if (message.timestamp != null && message.hasOwnProperty("timestamp"))
            if (typeof message.timestamp === "number")
              object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
            else
              object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
          if (message.delay != null && message.hasOwnProperty("delay"))
            object.delay = message.delay;
          if (message.tripProperties != null && message.hasOwnProperty("tripProperties"))
            object.tripProperties = $root.transit_realtime.TripUpdate.TripProperties.toObject(message.tripProperties, options);
          return object;
        };
        TripUpdate.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TripUpdate.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TripUpdate";
        };
        TripUpdate.StopTimeEvent = (function() {
          function StopTimeEvent(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          StopTimeEvent.prototype.delay = 0;
          StopTimeEvent.prototype.time = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
          StopTimeEvent.prototype.uncertainty = 0;
          StopTimeEvent.prototype.scheduledTime = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
          StopTimeEvent.create = function create(properties) {
            return new StopTimeEvent(properties);
          };
          StopTimeEvent.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.delay != null && Object.hasOwnProperty.call(message, "delay"))
              writer.uint32(
                /* id 1, wireType 0 =*/
                8
              ).int32(message.delay);
            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
              writer.uint32(
                /* id 2, wireType 0 =*/
                16
              ).int64(message.time);
            if (message.uncertainty != null && Object.hasOwnProperty.call(message, "uncertainty"))
              writer.uint32(
                /* id 3, wireType 0 =*/
                24
              ).int32(message.uncertainty);
            if (message.scheduledTime != null && Object.hasOwnProperty.call(message, "scheduledTime"))
              writer.uint32(
                /* id 4, wireType 0 =*/
                32
              ).int64(message.scheduledTime);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          StopTimeEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          StopTimeEvent.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripUpdate.StopTimeEvent();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 0)
                    break;
                  message.delay = reader.int32();
                  continue;
                }
                case 2: {
                  if (wireType !== 0)
                    break;
                  message.time = reader.int64();
                  continue;
                }
                case 3: {
                  if (wireType !== 0)
                    break;
                  message.uncertainty = reader.int32();
                  continue;
                }
                case 4: {
                  if (wireType !== 0)
                    break;
                  message.scheduledTime = reader.int64();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          StopTimeEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          StopTimeEvent.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.delay != null && message.hasOwnProperty("delay")) {
              if (!$util.isInteger(message.delay))
                return "delay: integer expected";
            }
            if (message.time != null && message.hasOwnProperty("time")) {
              if (!$util.isInteger(message.time) && !(message.time && $util.isInteger(message.time.low) && $util.isInteger(message.time.high)))
                return "time: integer|Long expected";
            }
            if (message.uncertainty != null && message.hasOwnProperty("uncertainty")) {
              if (!$util.isInteger(message.uncertainty))
                return "uncertainty: integer expected";
            }
            if (message.scheduledTime != null && message.hasOwnProperty("scheduledTime")) {
              if (!$util.isInteger(message.scheduledTime) && !(message.scheduledTime && $util.isInteger(message.scheduledTime.low) && $util.isInteger(message.scheduledTime.high)))
                return "scheduledTime: integer|Long expected";
            }
            return null;
          };
          StopTimeEvent.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripUpdate.StopTimeEvent)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripUpdate.StopTimeEvent();
            if (object.delay != null)
              message.delay = object.delay | 0;
            if (object.time != null) {
              if ($util.Long)
                (message.time = $util.Long.fromValue(object.time)).unsigned = false;
              else if (typeof object.time === "string")
                message.time = parseInt(object.time, 10);
              else if (typeof object.time === "number")
                message.time = object.time;
              else if (typeof object.time === "object")
                message.time = new $util.LongBits(object.time.low >>> 0, object.time.high >>> 0).toNumber();
            }
            if (object.uncertainty != null)
              message.uncertainty = object.uncertainty | 0;
            if (object.scheduledTime != null) {
              if ($util.Long)
                (message.scheduledTime = $util.Long.fromValue(object.scheduledTime)).unsigned = false;
              else if (typeof object.scheduledTime === "string")
                message.scheduledTime = parseInt(object.scheduledTime, 10);
              else if (typeof object.scheduledTime === "number")
                message.scheduledTime = object.scheduledTime;
              else if (typeof object.scheduledTime === "object")
                message.scheduledTime = new $util.LongBits(object.scheduledTime.low >>> 0, object.scheduledTime.high >>> 0).toNumber();
            }
            return message;
          };
          StopTimeEvent.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.delay = 0;
              if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.time = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
              } else
                object.time = options.longs === String ? "0" : 0;
              object.uncertainty = 0;
              if ($util.Long) {
                var long = new $util.Long(0, 0, false);
                object.scheduledTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
              } else
                object.scheduledTime = options.longs === String ? "0" : 0;
            }
            if (message.delay != null && message.hasOwnProperty("delay"))
              object.delay = message.delay;
            if (message.time != null && message.hasOwnProperty("time"))
              if (typeof message.time === "number")
                object.time = options.longs === String ? String(message.time) : message.time;
              else
                object.time = options.longs === String ? $util.Long.prototype.toString.call(message.time) : options.longs === Number ? new $util.LongBits(message.time.low >>> 0, message.time.high >>> 0).toNumber() : message.time;
            if (message.uncertainty != null && message.hasOwnProperty("uncertainty"))
              object.uncertainty = message.uncertainty;
            if (message.scheduledTime != null && message.hasOwnProperty("scheduledTime"))
              if (typeof message.scheduledTime === "number")
                object.scheduledTime = options.longs === String ? String(message.scheduledTime) : message.scheduledTime;
              else
                object.scheduledTime = options.longs === String ? $util.Long.prototype.toString.call(message.scheduledTime) : options.longs === Number ? new $util.LongBits(message.scheduledTime.low >>> 0, message.scheduledTime.high >>> 0).toNumber() : message.scheduledTime;
            return object;
          };
          StopTimeEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          StopTimeEvent.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripUpdate.StopTimeEvent";
          };
          return StopTimeEvent;
        })();
        TripUpdate.StopTimeUpdate = (function() {
          function StopTimeUpdate(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          StopTimeUpdate.prototype.stopSequence = 0;
          StopTimeUpdate.prototype.stopId = "";
          StopTimeUpdate.prototype.arrival = null;
          StopTimeUpdate.prototype.departure = null;
          StopTimeUpdate.prototype.departureOccupancyStatus = 0;
          StopTimeUpdate.prototype.scheduleRelationship = 0;
          StopTimeUpdate.prototype.stopTimeProperties = null;
          StopTimeUpdate.create = function create(properties) {
            return new StopTimeUpdate(properties);
          };
          StopTimeUpdate.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.stopSequence != null && Object.hasOwnProperty.call(message, "stopSequence"))
              writer.uint32(
                /* id 1, wireType 0 =*/
                8
              ).uint32(message.stopSequence);
            if (message.arrival != null && Object.hasOwnProperty.call(message, "arrival"))
              $root.transit_realtime.TripUpdate.StopTimeEvent.encode(message.arrival, writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).fork()).ldelim();
            if (message.departure != null && Object.hasOwnProperty.call(message, "departure"))
              $root.transit_realtime.TripUpdate.StopTimeEvent.encode(message.departure, writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).fork()).ldelim();
            if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
              writer.uint32(
                /* id 4, wireType 2 =*/
                34
              ).string(message.stopId);
            if (message.scheduleRelationship != null && Object.hasOwnProperty.call(message, "scheduleRelationship"))
              writer.uint32(
                /* id 5, wireType 0 =*/
                40
              ).int32(message.scheduleRelationship);
            if (message.stopTimeProperties != null && Object.hasOwnProperty.call(message, "stopTimeProperties"))
              $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.encode(message.stopTimeProperties, writer.uint32(
                /* id 6, wireType 2 =*/
                50
              ).fork()).ldelim();
            if (message.departureOccupancyStatus != null && Object.hasOwnProperty.call(message, "departureOccupancyStatus"))
              writer.uint32(
                /* id 7, wireType 0 =*/
                56
              ).int32(message.departureOccupancyStatus);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          StopTimeUpdate.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          StopTimeUpdate.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripUpdate.StopTimeUpdate();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 0)
                    break;
                  message.stopSequence = reader.uint32();
                  continue;
                }
                case 4: {
                  if (wireType !== 2)
                    break;
                  message.stopId = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.arrival = $root.transit_realtime.TripUpdate.StopTimeEvent.decode(reader, reader.uint32(), void 0, _depth + 1, message.arrival);
                  continue;
                }
                case 3: {
                  if (wireType !== 2)
                    break;
                  message.departure = $root.transit_realtime.TripUpdate.StopTimeEvent.decode(reader, reader.uint32(), void 0, _depth + 1, message.departure);
                  continue;
                }
                case 7: {
                  if (wireType !== 0)
                    break;
                  message.departureOccupancyStatus = reader.int32();
                  continue;
                }
                case 5: {
                  if (wireType !== 0)
                    break;
                  message.scheduleRelationship = reader.int32();
                  continue;
                }
                case 6: {
                  if (wireType !== 2)
                    break;
                  message.stopTimeProperties = $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.decode(reader, reader.uint32(), void 0, _depth + 1, message.stopTimeProperties);
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          StopTimeUpdate.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          StopTimeUpdate.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.stopSequence != null && message.hasOwnProperty("stopSequence")) {
              if (!$util.isInteger(message.stopSequence))
                return "stopSequence: integer expected";
            }
            if (message.stopId != null && message.hasOwnProperty("stopId")) {
              if (!$util.isString(message.stopId))
                return "stopId: string expected";
            }
            if (message.arrival != null && message.hasOwnProperty("arrival")) {
              var error = $root.transit_realtime.TripUpdate.StopTimeEvent.verify(message.arrival, _depth + 1);
              if (error)
                return "arrival." + error;
            }
            if (message.departure != null && message.hasOwnProperty("departure")) {
              var error = $root.transit_realtime.TripUpdate.StopTimeEvent.verify(message.departure, _depth + 1);
              if (error)
                return "departure." + error;
            }
            if (message.departureOccupancyStatus != null && message.hasOwnProperty("departureOccupancyStatus"))
              switch (message.departureOccupancyStatus) {
                default:
                  return "departureOccupancyStatus: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                  break;
              }
            if (message.scheduleRelationship != null && message.hasOwnProperty("scheduleRelationship"))
              switch (message.scheduleRelationship) {
                default:
                  return "scheduleRelationship: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                  break;
              }
            if (message.stopTimeProperties != null && message.hasOwnProperty("stopTimeProperties")) {
              var error = $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.verify(message.stopTimeProperties, _depth + 1);
              if (error)
                return "stopTimeProperties." + error;
            }
            return null;
          };
          StopTimeUpdate.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripUpdate.StopTimeUpdate)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripUpdate.StopTimeUpdate();
            if (object.stopSequence != null)
              message.stopSequence = object.stopSequence >>> 0;
            if (object.stopId != null)
              message.stopId = String(object.stopId);
            if (object.arrival != null) {
              if (typeof object.arrival !== "object")
                throw TypeError(".transit_realtime.TripUpdate.StopTimeUpdate.arrival: object expected");
              message.arrival = $root.transit_realtime.TripUpdate.StopTimeEvent.fromObject(object.arrival, _depth + 1);
            }
            if (object.departure != null) {
              if (typeof object.departure !== "object")
                throw TypeError(".transit_realtime.TripUpdate.StopTimeUpdate.departure: object expected");
              message.departure = $root.transit_realtime.TripUpdate.StopTimeEvent.fromObject(object.departure, _depth + 1);
            }
            switch (object.departureOccupancyStatus) {
              default:
                if (typeof object.departureOccupancyStatus === "number") {
                  message.departureOccupancyStatus = object.departureOccupancyStatus;
                  break;
                }
                break;
              case "EMPTY":
              case 0:
                message.departureOccupancyStatus = 0;
                break;
              case "MANY_SEATS_AVAILABLE":
              case 1:
                message.departureOccupancyStatus = 1;
                break;
              case "FEW_SEATS_AVAILABLE":
              case 2:
                message.departureOccupancyStatus = 2;
                break;
              case "STANDING_ROOM_ONLY":
              case 3:
                message.departureOccupancyStatus = 3;
                break;
              case "CRUSHED_STANDING_ROOM_ONLY":
              case 4:
                message.departureOccupancyStatus = 4;
                break;
              case "FULL":
              case 5:
                message.departureOccupancyStatus = 5;
                break;
              case "NOT_ACCEPTING_PASSENGERS":
              case 6:
                message.departureOccupancyStatus = 6;
                break;
              case "NO_DATA_AVAILABLE":
              case 7:
                message.departureOccupancyStatus = 7;
                break;
              case "NOT_BOARDABLE":
              case 8:
                message.departureOccupancyStatus = 8;
                break;
            }
            switch (object.scheduleRelationship) {
              default:
                if (typeof object.scheduleRelationship === "number") {
                  message.scheduleRelationship = object.scheduleRelationship;
                  break;
                }
                break;
              case "SCHEDULED":
              case 0:
                message.scheduleRelationship = 0;
                break;
              case "SKIPPED":
              case 1:
                message.scheduleRelationship = 1;
                break;
              case "NO_DATA":
              case 2:
                message.scheduleRelationship = 2;
                break;
              case "UNSCHEDULED":
              case 3:
                message.scheduleRelationship = 3;
                break;
            }
            if (object.stopTimeProperties != null) {
              if (typeof object.stopTimeProperties !== "object")
                throw TypeError(".transit_realtime.TripUpdate.StopTimeUpdate.stopTimeProperties: object expected");
              message.stopTimeProperties = $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.fromObject(object.stopTimeProperties, _depth + 1);
            }
            return message;
          };
          StopTimeUpdate.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.stopSequence = 0;
              object.arrival = null;
              object.departure = null;
              object.stopId = "";
              object.scheduleRelationship = options.enums === String ? "SCHEDULED" : 0;
              object.stopTimeProperties = null;
              object.departureOccupancyStatus = options.enums === String ? "EMPTY" : 0;
            }
            if (message.stopSequence != null && message.hasOwnProperty("stopSequence"))
              object.stopSequence = message.stopSequence;
            if (message.arrival != null && message.hasOwnProperty("arrival"))
              object.arrival = $root.transit_realtime.TripUpdate.StopTimeEvent.toObject(message.arrival, options);
            if (message.departure != null && message.hasOwnProperty("departure"))
              object.departure = $root.transit_realtime.TripUpdate.StopTimeEvent.toObject(message.departure, options);
            if (message.stopId != null && message.hasOwnProperty("stopId"))
              object.stopId = message.stopId;
            if (message.scheduleRelationship != null && message.hasOwnProperty("scheduleRelationship"))
              object.scheduleRelationship = options.enums === String ? $root.transit_realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship[message.scheduleRelationship] === void 0 ? message.scheduleRelationship : $root.transit_realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship[message.scheduleRelationship] : message.scheduleRelationship;
            if (message.stopTimeProperties != null && message.hasOwnProperty("stopTimeProperties"))
              object.stopTimeProperties = $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.toObject(message.stopTimeProperties, options);
            if (message.departureOccupancyStatus != null && message.hasOwnProperty("departureOccupancyStatus"))
              object.departureOccupancyStatus = options.enums === String ? $root.transit_realtime.VehiclePosition.OccupancyStatus[message.departureOccupancyStatus] === void 0 ? message.departureOccupancyStatus : $root.transit_realtime.VehiclePosition.OccupancyStatus[message.departureOccupancyStatus] : message.departureOccupancyStatus;
            return object;
          };
          StopTimeUpdate.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          StopTimeUpdate.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripUpdate.StopTimeUpdate";
          };
          StopTimeUpdate.ScheduleRelationship = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "SCHEDULED"] = 0;
            values[valuesById[1] = "SKIPPED"] = 1;
            values[valuesById[2] = "NO_DATA"] = 2;
            values[valuesById[3] = "UNSCHEDULED"] = 3;
            return values;
          })();
          StopTimeUpdate.StopTimeProperties = (function() {
            function StopTimeProperties(properties) {
              if (properties) {
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                  if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
              }
            }
            StopTimeProperties.prototype.assignedStopId = "";
            StopTimeProperties.prototype.stopHeadsign = "";
            StopTimeProperties.prototype.pickupType = 0;
            StopTimeProperties.prototype.dropOffType = 0;
            StopTimeProperties.create = function create(properties) {
              return new StopTimeProperties(properties);
            };
            StopTimeProperties.encode = function encode(message, writer) {
              if (!writer)
                writer = $Writer.create();
              if (message.assignedStopId != null && Object.hasOwnProperty.call(message, "assignedStopId"))
                writer.uint32(
                  /* id 1, wireType 2 =*/
                  10
                ).string(message.assignedStopId);
              if (message.stopHeadsign != null && Object.hasOwnProperty.call(message, "stopHeadsign"))
                writer.uint32(
                  /* id 2, wireType 2 =*/
                  18
                ).string(message.stopHeadsign);
              if (message.pickupType != null && Object.hasOwnProperty.call(message, "pickupType"))
                writer.uint32(
                  /* id 3, wireType 0 =*/
                  24
                ).int32(message.pickupType);
              if (message.dropOffType != null && Object.hasOwnProperty.call(message, "dropOffType"))
                writer.uint32(
                  /* id 4, wireType 0 =*/
                  32
                ).int32(message.dropOffType);
              if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                  writer.raw(message.$unknowns[i]);
              return writer;
            };
            StopTimeProperties.encodeDelimited = function encodeDelimited(message, writer) {
              return this.encode(message, writer).ldelim();
            };
            StopTimeProperties.decode = function decode(reader, length, _end, _depth, _target) {
              if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
              if (_depth === void 0)
                _depth = 0;
              if (_depth > $Reader.recursionLimit)
                throw Error("max depth exceeded");
              var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties();
              while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                  _end = void 0;
                  break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                  case 1: {
                    if (wireType !== 2)
                      break;
                    message.assignedStopId = reader.string();
                    continue;
                  }
                  case 2: {
                    if (wireType !== 2)
                      break;
                    message.stopHeadsign = reader.string();
                    continue;
                  }
                  case 3: {
                    if (wireType !== 0)
                      break;
                    message.pickupType = reader.int32();
                    continue;
                  }
                  case 4: {
                    if (wireType !== 0)
                      break;
                    message.dropOffType = reader.int32();
                    continue;
                  }
                }
                reader.skipType(wireType, _depth, tag);
                $util.makeProp(message, "$unknowns", false);
                (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
              }
              if (_end !== void 0)
                throw Error("missing end group");
              return message;
            };
            StopTimeProperties.decodeDelimited = function decodeDelimited(reader) {
              if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
              return this.decode(reader, reader.uint32());
            };
            StopTimeProperties.verify = function verify(message, _depth) {
              if (typeof message !== "object" || message === null)
                return "object expected";
              if (_depth === void 0)
                _depth = 0;
              if (_depth > $util.recursionLimit)
                return "max depth exceeded";
              if (message.assignedStopId != null && message.hasOwnProperty("assignedStopId")) {
                if (!$util.isString(message.assignedStopId))
                  return "assignedStopId: string expected";
              }
              if (message.stopHeadsign != null && message.hasOwnProperty("stopHeadsign")) {
                if (!$util.isString(message.stopHeadsign))
                  return "stopHeadsign: string expected";
              }
              if (message.pickupType != null && message.hasOwnProperty("pickupType"))
                switch (message.pickupType) {
                  default:
                    return "pickupType: enum value expected";
                  case 0:
                  case 1:
                  case 2:
                  case 3:
                    break;
                }
              if (message.dropOffType != null && message.hasOwnProperty("dropOffType"))
                switch (message.dropOffType) {
                  default:
                    return "dropOffType: enum value expected";
                  case 0:
                  case 1:
                  case 2:
                  case 3:
                    break;
                }
              return null;
            };
            StopTimeProperties.fromObject = function fromObject(object, _depth) {
              if (object instanceof $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties)
                return object;
              if (_depth === void 0)
                _depth = 0;
              if (_depth > $util.recursionLimit)
                throw Error("max depth exceeded");
              var message = new $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties();
              if (object.assignedStopId != null)
                message.assignedStopId = String(object.assignedStopId);
              if (object.stopHeadsign != null)
                message.stopHeadsign = String(object.stopHeadsign);
              switch (object.pickupType) {
                default:
                  if (typeof object.pickupType === "number") {
                    message.pickupType = object.pickupType;
                    break;
                  }
                  break;
                case "REGULAR":
                case 0:
                  message.pickupType = 0;
                  break;
                case "NONE":
                case 1:
                  message.pickupType = 1;
                  break;
                case "PHONE_AGENCY":
                case 2:
                  message.pickupType = 2;
                  break;
                case "COORDINATE_WITH_DRIVER":
                case 3:
                  message.pickupType = 3;
                  break;
              }
              switch (object.dropOffType) {
                default:
                  if (typeof object.dropOffType === "number") {
                    message.dropOffType = object.dropOffType;
                    break;
                  }
                  break;
                case "REGULAR":
                case 0:
                  message.dropOffType = 0;
                  break;
                case "NONE":
                case 1:
                  message.dropOffType = 1;
                  break;
                case "PHONE_AGENCY":
                case 2:
                  message.dropOffType = 2;
                  break;
                case "COORDINATE_WITH_DRIVER":
                case 3:
                  message.dropOffType = 3;
                  break;
              }
              return message;
            };
            StopTimeProperties.toObject = function toObject(message, options) {
              if (!options)
                options = {};
              var object = {};
              if (options.defaults) {
                object.assignedStopId = "";
                object.stopHeadsign = "";
                object.pickupType = options.enums === String ? "REGULAR" : 0;
                object.dropOffType = options.enums === String ? "REGULAR" : 0;
              }
              if (message.assignedStopId != null && message.hasOwnProperty("assignedStopId"))
                object.assignedStopId = message.assignedStopId;
              if (message.stopHeadsign != null && message.hasOwnProperty("stopHeadsign"))
                object.stopHeadsign = message.stopHeadsign;
              if (message.pickupType != null && message.hasOwnProperty("pickupType"))
                object.pickupType = options.enums === String ? $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.DropOffPickupType[message.pickupType] === void 0 ? message.pickupType : $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.DropOffPickupType[message.pickupType] : message.pickupType;
              if (message.dropOffType != null && message.hasOwnProperty("dropOffType"))
                object.dropOffType = options.enums === String ? $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.DropOffPickupType[message.dropOffType] === void 0 ? message.dropOffType : $root.transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties.DropOffPickupType[message.dropOffType] : message.dropOffType;
              return object;
            };
            StopTimeProperties.prototype.toJSON = function toJSON() {
              return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };
            StopTimeProperties.getTypeUrl = function getTypeUrl(prefix) {
              if (prefix === void 0)
                prefix = "type.googleapis.com";
              return prefix + "/transit_realtime.TripUpdate.StopTimeUpdate.StopTimeProperties";
            };
            StopTimeProperties.DropOffPickupType = (function() {
              var valuesById = {}, values = Object.create(valuesById);
              values[valuesById[0] = "REGULAR"] = 0;
              values[valuesById[1] = "NONE"] = 1;
              values[valuesById[2] = "PHONE_AGENCY"] = 2;
              values[valuesById[3] = "COORDINATE_WITH_DRIVER"] = 3;
              return values;
            })();
            return StopTimeProperties;
          })();
          return StopTimeUpdate;
        })();
        TripUpdate.TripProperties = (function() {
          function TripProperties(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          TripProperties.prototype.tripId = "";
          TripProperties.prototype.startDate = "";
          TripProperties.prototype.startTime = "";
          TripProperties.prototype.shapeId = "";
          TripProperties.prototype.tripHeadsign = "";
          TripProperties.prototype.tripShortName = "";
          TripProperties.create = function create(properties) {
            return new TripProperties(properties);
          };
          TripProperties.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.tripId != null && Object.hasOwnProperty.call(message, "tripId"))
              writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).string(message.tripId);
            if (message.startDate != null && Object.hasOwnProperty.call(message, "startDate"))
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.startDate);
            if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
              writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).string(message.startTime);
            if (message.shapeId != null && Object.hasOwnProperty.call(message, "shapeId"))
              writer.uint32(
                /* id 4, wireType 2 =*/
                34
              ).string(message.shapeId);
            if (message.tripHeadsign != null && Object.hasOwnProperty.call(message, "tripHeadsign"))
              writer.uint32(
                /* id 5, wireType 2 =*/
                42
              ).string(message.tripHeadsign);
            if (message.tripShortName != null && Object.hasOwnProperty.call(message, "tripShortName"))
              writer.uint32(
                /* id 6, wireType 2 =*/
                50
              ).string(message.tripShortName);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          TripProperties.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          TripProperties.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripUpdate.TripProperties();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.tripId = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.startDate = reader.string();
                  continue;
                }
                case 3: {
                  if (wireType !== 2)
                    break;
                  message.startTime = reader.string();
                  continue;
                }
                case 4: {
                  if (wireType !== 2)
                    break;
                  message.shapeId = reader.string();
                  continue;
                }
                case 5: {
                  if (wireType !== 2)
                    break;
                  message.tripHeadsign = reader.string();
                  continue;
                }
                case 6: {
                  if (wireType !== 2)
                    break;
                  message.tripShortName = reader.string();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          TripProperties.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          TripProperties.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.tripId != null && message.hasOwnProperty("tripId")) {
              if (!$util.isString(message.tripId))
                return "tripId: string expected";
            }
            if (message.startDate != null && message.hasOwnProperty("startDate")) {
              if (!$util.isString(message.startDate))
                return "startDate: string expected";
            }
            if (message.startTime != null && message.hasOwnProperty("startTime")) {
              if (!$util.isString(message.startTime))
                return "startTime: string expected";
            }
            if (message.shapeId != null && message.hasOwnProperty("shapeId")) {
              if (!$util.isString(message.shapeId))
                return "shapeId: string expected";
            }
            if (message.tripHeadsign != null && message.hasOwnProperty("tripHeadsign")) {
              if (!$util.isString(message.tripHeadsign))
                return "tripHeadsign: string expected";
            }
            if (message.tripShortName != null && message.hasOwnProperty("tripShortName")) {
              if (!$util.isString(message.tripShortName))
                return "tripShortName: string expected";
            }
            return null;
          };
          TripProperties.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripUpdate.TripProperties)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripUpdate.TripProperties();
            if (object.tripId != null)
              message.tripId = String(object.tripId);
            if (object.startDate != null)
              message.startDate = String(object.startDate);
            if (object.startTime != null)
              message.startTime = String(object.startTime);
            if (object.shapeId != null)
              message.shapeId = String(object.shapeId);
            if (object.tripHeadsign != null)
              message.tripHeadsign = String(object.tripHeadsign);
            if (object.tripShortName != null)
              message.tripShortName = String(object.tripShortName);
            return message;
          };
          TripProperties.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.tripId = "";
              object.startDate = "";
              object.startTime = "";
              object.shapeId = "";
              object.tripHeadsign = "";
              object.tripShortName = "";
            }
            if (message.tripId != null && message.hasOwnProperty("tripId"))
              object.tripId = message.tripId;
            if (message.startDate != null && message.hasOwnProperty("startDate"))
              object.startDate = message.startDate;
            if (message.startTime != null && message.hasOwnProperty("startTime"))
              object.startTime = message.startTime;
            if (message.shapeId != null && message.hasOwnProperty("shapeId"))
              object.shapeId = message.shapeId;
            if (message.tripHeadsign != null && message.hasOwnProperty("tripHeadsign"))
              object.tripHeadsign = message.tripHeadsign;
            if (message.tripShortName != null && message.hasOwnProperty("tripShortName"))
              object.tripShortName = message.tripShortName;
            return object;
          };
          TripProperties.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          TripProperties.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripUpdate.TripProperties";
          };
          return TripProperties;
        })();
        return TripUpdate;
      })();
      transit_realtime2.VehiclePosition = (function() {
        function VehiclePosition(properties) {
          this.multiCarriageDetails = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        VehiclePosition.prototype.trip = null;
        VehiclePosition.prototype.vehicle = null;
        VehiclePosition.prototype.position = null;
        VehiclePosition.prototype.currentStopSequence = 0;
        VehiclePosition.prototype.stopId = "";
        VehiclePosition.prototype.currentStatus = 2;
        VehiclePosition.prototype.timestamp = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
        VehiclePosition.prototype.congestionLevel = 0;
        VehiclePosition.prototype.occupancyStatus = 0;
        VehiclePosition.prototype.occupancyPercentage = 0;
        VehiclePosition.prototype.multiCarriageDetails = $util.emptyArray;
        VehiclePosition.create = function create(properties) {
          return new VehiclePosition(properties);
        };
        VehiclePosition.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.trip != null && Object.hasOwnProperty.call(message, "trip"))
            $root.transit_realtime.TripDescriptor.encode(message.trip, writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).fork()).ldelim();
          if (message.position != null && Object.hasOwnProperty.call(message, "position"))
            $root.transit_realtime.Position.encode(message.position, writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).fork()).ldelim();
          if (message.currentStopSequence != null && Object.hasOwnProperty.call(message, "currentStopSequence"))
            writer.uint32(
              /* id 3, wireType 0 =*/
              24
            ).uint32(message.currentStopSequence);
          if (message.currentStatus != null && Object.hasOwnProperty.call(message, "currentStatus"))
            writer.uint32(
              /* id 4, wireType 0 =*/
              32
            ).int32(message.currentStatus);
          if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
            writer.uint32(
              /* id 5, wireType 0 =*/
              40
            ).uint64(message.timestamp);
          if (message.congestionLevel != null && Object.hasOwnProperty.call(message, "congestionLevel"))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).int32(message.congestionLevel);
          if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
            writer.uint32(
              /* id 7, wireType 2 =*/
              58
            ).string(message.stopId);
          if (message.vehicle != null && Object.hasOwnProperty.call(message, "vehicle"))
            $root.transit_realtime.VehicleDescriptor.encode(message.vehicle, writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).fork()).ldelim();
          if (message.occupancyStatus != null && Object.hasOwnProperty.call(message, "occupancyStatus"))
            writer.uint32(
              /* id 9, wireType 0 =*/
              72
            ).int32(message.occupancyStatus);
          if (message.occupancyPercentage != null && Object.hasOwnProperty.call(message, "occupancyPercentage"))
            writer.uint32(
              /* id 10, wireType 0 =*/
              80
            ).uint32(message.occupancyPercentage);
          if (message.multiCarriageDetails != null && message.multiCarriageDetails.length)
            for (var i = 0; i < message.multiCarriageDetails.length; ++i)
              $root.transit_realtime.VehiclePosition.CarriageDetails.encode(message.multiCarriageDetails[i], writer.uint32(
                /* id 11, wireType 2 =*/
                90
              ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        VehiclePosition.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        VehiclePosition.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.VehiclePosition();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.trip = $root.transit_realtime.TripDescriptor.decode(reader, reader.uint32(), void 0, _depth + 1, message.trip);
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                message.vehicle = $root.transit_realtime.VehicleDescriptor.decode(reader, reader.uint32(), void 0, _depth + 1, message.vehicle);
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.position = $root.transit_realtime.Position.decode(reader, reader.uint32(), void 0, _depth + 1, message.position);
                continue;
              }
              case 3: {
                if (wireType !== 0)
                  break;
                message.currentStopSequence = reader.uint32();
                continue;
              }
              case 7: {
                if (wireType !== 2)
                  break;
                message.stopId = reader.string();
                continue;
              }
              case 4: {
                if (wireType !== 0)
                  break;
                message.currentStatus = reader.int32();
                continue;
              }
              case 5: {
                if (wireType !== 0)
                  break;
                message.timestamp = reader.uint64();
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                message.congestionLevel = reader.int32();
                continue;
              }
              case 9: {
                if (wireType !== 0)
                  break;
                message.occupancyStatus = reader.int32();
                continue;
              }
              case 10: {
                if (wireType !== 0)
                  break;
                message.occupancyPercentage = reader.uint32();
                continue;
              }
              case 11: {
                if (wireType !== 2)
                  break;
                if (!(message.multiCarriageDetails && message.multiCarriageDetails.length))
                  message.multiCarriageDetails = [];
                message.multiCarriageDetails.push($root.transit_realtime.VehiclePosition.CarriageDetails.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        VehiclePosition.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        VehiclePosition.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.trip != null && message.hasOwnProperty("trip")) {
            var error = $root.transit_realtime.TripDescriptor.verify(message.trip, _depth + 1);
            if (error)
              return "trip." + error;
          }
          if (message.vehicle != null && message.hasOwnProperty("vehicle")) {
            var error = $root.transit_realtime.VehicleDescriptor.verify(message.vehicle, _depth + 1);
            if (error)
              return "vehicle." + error;
          }
          if (message.position != null && message.hasOwnProperty("position")) {
            var error = $root.transit_realtime.Position.verify(message.position, _depth + 1);
            if (error)
              return "position." + error;
          }
          if (message.currentStopSequence != null && message.hasOwnProperty("currentStopSequence")) {
            if (!$util.isInteger(message.currentStopSequence))
              return "currentStopSequence: integer expected";
          }
          if (message.stopId != null && message.hasOwnProperty("stopId")) {
            if (!$util.isString(message.stopId))
              return "stopId: string expected";
          }
          if (message.currentStatus != null && message.hasOwnProperty("currentStatus"))
            switch (message.currentStatus) {
              default:
                return "currentStatus: enum value expected";
              case 0:
              case 1:
              case 2:
                break;
            }
          if (message.timestamp != null && message.hasOwnProperty("timestamp")) {
            if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
              return "timestamp: integer|Long expected";
          }
          if (message.congestionLevel != null && message.hasOwnProperty("congestionLevel"))
            switch (message.congestionLevel) {
              default:
                return "congestionLevel: enum value expected";
              case 0:
              case 1:
              case 2:
              case 3:
              case 4:
                break;
            }
          if (message.occupancyStatus != null && message.hasOwnProperty("occupancyStatus"))
            switch (message.occupancyStatus) {
              default:
                return "occupancyStatus: enum value expected";
              case 0:
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
              case 6:
              case 7:
              case 8:
                break;
            }
          if (message.occupancyPercentage != null && message.hasOwnProperty("occupancyPercentage")) {
            if (!$util.isInteger(message.occupancyPercentage))
              return "occupancyPercentage: integer expected";
          }
          if (message.multiCarriageDetails != null && message.hasOwnProperty("multiCarriageDetails")) {
            if (!Array.isArray(message.multiCarriageDetails))
              return "multiCarriageDetails: array expected";
            for (var i = 0; i < message.multiCarriageDetails.length; ++i) {
              var error = $root.transit_realtime.VehiclePosition.CarriageDetails.verify(message.multiCarriageDetails[i], _depth + 1);
              if (error)
                return "multiCarriageDetails." + error;
            }
          }
          return null;
        };
        VehiclePosition.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.VehiclePosition)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.VehiclePosition();
          if (object.trip != null) {
            if (typeof object.trip !== "object")
              throw TypeError(".transit_realtime.VehiclePosition.trip: object expected");
            message.trip = $root.transit_realtime.TripDescriptor.fromObject(object.trip, _depth + 1);
          }
          if (object.vehicle != null) {
            if (typeof object.vehicle !== "object")
              throw TypeError(".transit_realtime.VehiclePosition.vehicle: object expected");
            message.vehicle = $root.transit_realtime.VehicleDescriptor.fromObject(object.vehicle, _depth + 1);
          }
          if (object.position != null) {
            if (typeof object.position !== "object")
              throw TypeError(".transit_realtime.VehiclePosition.position: object expected");
            message.position = $root.transit_realtime.Position.fromObject(object.position, _depth + 1);
          }
          if (object.currentStopSequence != null)
            message.currentStopSequence = object.currentStopSequence >>> 0;
          if (object.stopId != null)
            message.stopId = String(object.stopId);
          switch (object.currentStatus) {
            case "INCOMING_AT":
            case 0:
              message.currentStatus = 0;
              break;
            case "STOPPED_AT":
            case 1:
              message.currentStatus = 1;
              break;
            default:
              if (typeof object.currentStatus === "number") {
                message.currentStatus = object.currentStatus;
                break;
              }
              break;
            case "IN_TRANSIT_TO":
            case 2:
              message.currentStatus = 2;
              break;
          }
          if (object.timestamp != null) {
            if ($util.Long)
              (message.timestamp = $util.Long.fromValue(object.timestamp)).unsigned = true;
            else if (typeof object.timestamp === "string")
              message.timestamp = parseInt(object.timestamp, 10);
            else if (typeof object.timestamp === "number")
              message.timestamp = object.timestamp;
            else if (typeof object.timestamp === "object")
              message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber(true);
          }
          switch (object.congestionLevel) {
            default:
              if (typeof object.congestionLevel === "number") {
                message.congestionLevel = object.congestionLevel;
                break;
              }
              break;
            case "UNKNOWN_CONGESTION_LEVEL":
            case 0:
              message.congestionLevel = 0;
              break;
            case "RUNNING_SMOOTHLY":
            case 1:
              message.congestionLevel = 1;
              break;
            case "STOP_AND_GO":
            case 2:
              message.congestionLevel = 2;
              break;
            case "CONGESTION":
            case 3:
              message.congestionLevel = 3;
              break;
            case "SEVERE_CONGESTION":
            case 4:
              message.congestionLevel = 4;
              break;
          }
          switch (object.occupancyStatus) {
            default:
              if (typeof object.occupancyStatus === "number") {
                message.occupancyStatus = object.occupancyStatus;
                break;
              }
              break;
            case "EMPTY":
            case 0:
              message.occupancyStatus = 0;
              break;
            case "MANY_SEATS_AVAILABLE":
            case 1:
              message.occupancyStatus = 1;
              break;
            case "FEW_SEATS_AVAILABLE":
            case 2:
              message.occupancyStatus = 2;
              break;
            case "STANDING_ROOM_ONLY":
            case 3:
              message.occupancyStatus = 3;
              break;
            case "CRUSHED_STANDING_ROOM_ONLY":
            case 4:
              message.occupancyStatus = 4;
              break;
            case "FULL":
            case 5:
              message.occupancyStatus = 5;
              break;
            case "NOT_ACCEPTING_PASSENGERS":
            case 6:
              message.occupancyStatus = 6;
              break;
            case "NO_DATA_AVAILABLE":
            case 7:
              message.occupancyStatus = 7;
              break;
            case "NOT_BOARDABLE":
            case 8:
              message.occupancyStatus = 8;
              break;
          }
          if (object.occupancyPercentage != null)
            message.occupancyPercentage = object.occupancyPercentage >>> 0;
          if (object.multiCarriageDetails) {
            if (!Array.isArray(object.multiCarriageDetails))
              throw TypeError(".transit_realtime.VehiclePosition.multiCarriageDetails: array expected");
            message.multiCarriageDetails = Array(object.multiCarriageDetails.length);
            for (var i = 0; i < object.multiCarriageDetails.length; ++i) {
              if (typeof object.multiCarriageDetails[i] !== "object")
                throw TypeError(".transit_realtime.VehiclePosition.multiCarriageDetails: object expected");
              message.multiCarriageDetails[i] = $root.transit_realtime.VehiclePosition.CarriageDetails.fromObject(object.multiCarriageDetails[i], _depth + 1);
            }
          }
          return message;
        };
        VehiclePosition.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults)
            object.multiCarriageDetails = [];
          if (options.defaults) {
            object.trip = null;
            object.position = null;
            object.currentStopSequence = 0;
            object.currentStatus = options.enums === String ? "IN_TRANSIT_TO" : 2;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.timestamp = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
              object.timestamp = options.longs === String ? "0" : 0;
            object.congestionLevel = options.enums === String ? "UNKNOWN_CONGESTION_LEVEL" : 0;
            object.stopId = "";
            object.vehicle = null;
            object.occupancyStatus = options.enums === String ? "EMPTY" : 0;
            object.occupancyPercentage = 0;
          }
          if (message.trip != null && message.hasOwnProperty("trip"))
            object.trip = $root.transit_realtime.TripDescriptor.toObject(message.trip, options);
          if (message.position != null && message.hasOwnProperty("position"))
            object.position = $root.transit_realtime.Position.toObject(message.position, options);
          if (message.currentStopSequence != null && message.hasOwnProperty("currentStopSequence"))
            object.currentStopSequence = message.currentStopSequence;
          if (message.currentStatus != null && message.hasOwnProperty("currentStatus"))
            object.currentStatus = options.enums === String ? $root.transit_realtime.VehiclePosition.VehicleStopStatus[message.currentStatus] === void 0 ? message.currentStatus : $root.transit_realtime.VehiclePosition.VehicleStopStatus[message.currentStatus] : message.currentStatus;
          if (message.timestamp != null && message.hasOwnProperty("timestamp"))
            if (typeof message.timestamp === "number")
              object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
            else
              object.timestamp = options.longs === String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber(true) : message.timestamp;
          if (message.congestionLevel != null && message.hasOwnProperty("congestionLevel"))
            object.congestionLevel = options.enums === String ? $root.transit_realtime.VehiclePosition.CongestionLevel[message.congestionLevel] === void 0 ? message.congestionLevel : $root.transit_realtime.VehiclePosition.CongestionLevel[message.congestionLevel] : message.congestionLevel;
          if (message.stopId != null && message.hasOwnProperty("stopId"))
            object.stopId = message.stopId;
          if (message.vehicle != null && message.hasOwnProperty("vehicle"))
            object.vehicle = $root.transit_realtime.VehicleDescriptor.toObject(message.vehicle, options);
          if (message.occupancyStatus != null && message.hasOwnProperty("occupancyStatus"))
            object.occupancyStatus = options.enums === String ? $root.transit_realtime.VehiclePosition.OccupancyStatus[message.occupancyStatus] === void 0 ? message.occupancyStatus : $root.transit_realtime.VehiclePosition.OccupancyStatus[message.occupancyStatus] : message.occupancyStatus;
          if (message.occupancyPercentage != null && message.hasOwnProperty("occupancyPercentage"))
            object.occupancyPercentage = message.occupancyPercentage;
          if (message.multiCarriageDetails && message.multiCarriageDetails.length) {
            object.multiCarriageDetails = Array(message.multiCarriageDetails.length);
            for (var j = 0; j < message.multiCarriageDetails.length; ++j)
              object.multiCarriageDetails[j] = $root.transit_realtime.VehiclePosition.CarriageDetails.toObject(message.multiCarriageDetails[j], options);
          }
          return object;
        };
        VehiclePosition.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        VehiclePosition.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.VehiclePosition";
        };
        VehiclePosition.VehicleStopStatus = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "INCOMING_AT"] = 0;
          values[valuesById[1] = "STOPPED_AT"] = 1;
          values[valuesById[2] = "IN_TRANSIT_TO"] = 2;
          return values;
        })();
        VehiclePosition.CongestionLevel = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "UNKNOWN_CONGESTION_LEVEL"] = 0;
          values[valuesById[1] = "RUNNING_SMOOTHLY"] = 1;
          values[valuesById[2] = "STOP_AND_GO"] = 2;
          values[valuesById[3] = "CONGESTION"] = 3;
          values[valuesById[4] = "SEVERE_CONGESTION"] = 4;
          return values;
        })();
        VehiclePosition.OccupancyStatus = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "EMPTY"] = 0;
          values[valuesById[1] = "MANY_SEATS_AVAILABLE"] = 1;
          values[valuesById[2] = "FEW_SEATS_AVAILABLE"] = 2;
          values[valuesById[3] = "STANDING_ROOM_ONLY"] = 3;
          values[valuesById[4] = "CRUSHED_STANDING_ROOM_ONLY"] = 4;
          values[valuesById[5] = "FULL"] = 5;
          values[valuesById[6] = "NOT_ACCEPTING_PASSENGERS"] = 6;
          values[valuesById[7] = "NO_DATA_AVAILABLE"] = 7;
          values[valuesById[8] = "NOT_BOARDABLE"] = 8;
          return values;
        })();
        VehiclePosition.CarriageDetails = (function() {
          function CarriageDetails(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          CarriageDetails.prototype.id = "";
          CarriageDetails.prototype.label = "";
          CarriageDetails.prototype.occupancyStatus = 7;
          CarriageDetails.prototype.occupancyPercentage = -1;
          CarriageDetails.prototype.carriageSequence = 0;
          CarriageDetails.create = function create(properties) {
            return new CarriageDetails(properties);
          };
          CarriageDetails.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
              writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).string(message.id);
            if (message.label != null && Object.hasOwnProperty.call(message, "label"))
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.label);
            if (message.occupancyStatus != null && Object.hasOwnProperty.call(message, "occupancyStatus"))
              writer.uint32(
                /* id 3, wireType 0 =*/
                24
              ).int32(message.occupancyStatus);
            if (message.occupancyPercentage != null && Object.hasOwnProperty.call(message, "occupancyPercentage"))
              writer.uint32(
                /* id 4, wireType 0 =*/
                32
              ).int32(message.occupancyPercentage);
            if (message.carriageSequence != null && Object.hasOwnProperty.call(message, "carriageSequence"))
              writer.uint32(
                /* id 5, wireType 0 =*/
                40
              ).uint32(message.carriageSequence);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          CarriageDetails.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          CarriageDetails.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.VehiclePosition.CarriageDetails();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.id = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.label = reader.string();
                  continue;
                }
                case 3: {
                  if (wireType !== 0)
                    break;
                  message.occupancyStatus = reader.int32();
                  continue;
                }
                case 4: {
                  if (wireType !== 0)
                    break;
                  message.occupancyPercentage = reader.int32();
                  continue;
                }
                case 5: {
                  if (wireType !== 0)
                    break;
                  message.carriageSequence = reader.uint32();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          CarriageDetails.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          CarriageDetails.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.id != null && message.hasOwnProperty("id")) {
              if (!$util.isString(message.id))
                return "id: string expected";
            }
            if (message.label != null && message.hasOwnProperty("label")) {
              if (!$util.isString(message.label))
                return "label: string expected";
            }
            if (message.occupancyStatus != null && message.hasOwnProperty("occupancyStatus"))
              switch (message.occupancyStatus) {
                default:
                  return "occupancyStatus: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                  break;
              }
            if (message.occupancyPercentage != null && message.hasOwnProperty("occupancyPercentage")) {
              if (!$util.isInteger(message.occupancyPercentage))
                return "occupancyPercentage: integer expected";
            }
            if (message.carriageSequence != null && message.hasOwnProperty("carriageSequence")) {
              if (!$util.isInteger(message.carriageSequence))
                return "carriageSequence: integer expected";
            }
            return null;
          };
          CarriageDetails.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.VehiclePosition.CarriageDetails)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.VehiclePosition.CarriageDetails();
            if (object.id != null)
              message.id = String(object.id);
            if (object.label != null)
              message.label = String(object.label);
            switch (object.occupancyStatus) {
              case "EMPTY":
              case 0:
                message.occupancyStatus = 0;
                break;
              case "MANY_SEATS_AVAILABLE":
              case 1:
                message.occupancyStatus = 1;
                break;
              case "FEW_SEATS_AVAILABLE":
              case 2:
                message.occupancyStatus = 2;
                break;
              case "STANDING_ROOM_ONLY":
              case 3:
                message.occupancyStatus = 3;
                break;
              case "CRUSHED_STANDING_ROOM_ONLY":
              case 4:
                message.occupancyStatus = 4;
                break;
              case "FULL":
              case 5:
                message.occupancyStatus = 5;
                break;
              case "NOT_ACCEPTING_PASSENGERS":
              case 6:
                message.occupancyStatus = 6;
                break;
              default:
                if (typeof object.occupancyStatus === "number") {
                  message.occupancyStatus = object.occupancyStatus;
                  break;
                }
                break;
              case "NO_DATA_AVAILABLE":
              case 7:
                message.occupancyStatus = 7;
                break;
              case "NOT_BOARDABLE":
              case 8:
                message.occupancyStatus = 8;
                break;
            }
            if (object.occupancyPercentage != null)
              message.occupancyPercentage = object.occupancyPercentage | 0;
            if (object.carriageSequence != null)
              message.carriageSequence = object.carriageSequence >>> 0;
            return message;
          };
          CarriageDetails.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.id = "";
              object.label = "";
              object.occupancyStatus = options.enums === String ? "NO_DATA_AVAILABLE" : 7;
              object.occupancyPercentage = -1;
              object.carriageSequence = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
              object.id = message.id;
            if (message.label != null && message.hasOwnProperty("label"))
              object.label = message.label;
            if (message.occupancyStatus != null && message.hasOwnProperty("occupancyStatus"))
              object.occupancyStatus = options.enums === String ? $root.transit_realtime.VehiclePosition.OccupancyStatus[message.occupancyStatus] === void 0 ? message.occupancyStatus : $root.transit_realtime.VehiclePosition.OccupancyStatus[message.occupancyStatus] : message.occupancyStatus;
            if (message.occupancyPercentage != null && message.hasOwnProperty("occupancyPercentage"))
              object.occupancyPercentage = message.occupancyPercentage;
            if (message.carriageSequence != null && message.hasOwnProperty("carriageSequence"))
              object.carriageSequence = message.carriageSequence;
            return object;
          };
          CarriageDetails.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          CarriageDetails.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.VehiclePosition.CarriageDetails";
          };
          return CarriageDetails;
        })();
        return VehiclePosition;
      })();
      transit_realtime2.Alert = (function() {
        function Alert(properties) {
          this.activePeriod = [];
          this.communicationPeriod = [];
          this.impactPeriod = [];
          this.informedEntity = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        Alert.prototype.activePeriod = $util.emptyArray;
        Alert.prototype.communicationPeriod = $util.emptyArray;
        Alert.prototype.impactPeriod = $util.emptyArray;
        Alert.prototype.informedEntity = $util.emptyArray;
        Alert.prototype.cause = 1;
        Alert.prototype.effect = 8;
        Alert.prototype.url = null;
        Alert.prototype.headerText = null;
        Alert.prototype.descriptionText = null;
        Alert.prototype.ttsHeaderText = null;
        Alert.prototype.ttsDescriptionText = null;
        Alert.prototype.severityLevel = 1;
        Alert.prototype.image = null;
        Alert.prototype.imageAlternativeText = null;
        Alert.prototype.causeDetail = null;
        Alert.prototype.effectDetail = null;
        Alert.create = function create(properties) {
          return new Alert(properties);
        };
        Alert.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.activePeriod != null && message.activePeriod.length)
            for (var i = 0; i < message.activePeriod.length; ++i)
              $root.transit_realtime.TimeRange.encode(message.activePeriod[i], writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).fork()).ldelim();
          if (message.communicationPeriod != null && message.communicationPeriod.length)
            for (var i = 0; i < message.communicationPeriod.length; ++i)
              $root.transit_realtime.TimeRange.encode(message.communicationPeriod[i], writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).fork()).ldelim();
          if (message.impactPeriod != null && message.impactPeriod.length)
            for (var i = 0; i < message.impactPeriod.length; ++i)
              $root.transit_realtime.TimeRange.encode(message.impactPeriod[i], writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).fork()).ldelim();
          if (message.informedEntity != null && message.informedEntity.length)
            for (var i = 0; i < message.informedEntity.length; ++i)
              $root.transit_realtime.EntitySelector.encode(message.informedEntity[i], writer.uint32(
                /* id 5, wireType 2 =*/
                42
              ).fork()).ldelim();
          if (message.cause != null && Object.hasOwnProperty.call(message, "cause"))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).int32(message.cause);
          if (message.effect != null && Object.hasOwnProperty.call(message, "effect"))
            writer.uint32(
              /* id 7, wireType 0 =*/
              56
            ).int32(message.effect);
          if (message.url != null && Object.hasOwnProperty.call(message, "url"))
            $root.transit_realtime.TranslatedString.encode(message.url, writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).fork()).ldelim();
          if (message.headerText != null && Object.hasOwnProperty.call(message, "headerText"))
            $root.transit_realtime.TranslatedString.encode(message.headerText, writer.uint32(
              /* id 10, wireType 2 =*/
              82
            ).fork()).ldelim();
          if (message.descriptionText != null && Object.hasOwnProperty.call(message, "descriptionText"))
            $root.transit_realtime.TranslatedString.encode(message.descriptionText, writer.uint32(
              /* id 11, wireType 2 =*/
              90
            ).fork()).ldelim();
          if (message.ttsHeaderText != null && Object.hasOwnProperty.call(message, "ttsHeaderText"))
            $root.transit_realtime.TranslatedString.encode(message.ttsHeaderText, writer.uint32(
              /* id 12, wireType 2 =*/
              98
            ).fork()).ldelim();
          if (message.ttsDescriptionText != null && Object.hasOwnProperty.call(message, "ttsDescriptionText"))
            $root.transit_realtime.TranslatedString.encode(message.ttsDescriptionText, writer.uint32(
              /* id 13, wireType 2 =*/
              106
            ).fork()).ldelim();
          if (message.severityLevel != null && Object.hasOwnProperty.call(message, "severityLevel"))
            writer.uint32(
              /* id 14, wireType 0 =*/
              112
            ).int32(message.severityLevel);
          if (message.image != null && Object.hasOwnProperty.call(message, "image"))
            $root.transit_realtime.TranslatedImage.encode(message.image, writer.uint32(
              /* id 15, wireType 2 =*/
              122
            ).fork()).ldelim();
          if (message.imageAlternativeText != null && Object.hasOwnProperty.call(message, "imageAlternativeText"))
            $root.transit_realtime.TranslatedString.encode(message.imageAlternativeText, writer.uint32(
              /* id 16, wireType 2 =*/
              130
            ).fork()).ldelim();
          if (message.causeDetail != null && Object.hasOwnProperty.call(message, "causeDetail"))
            $root.transit_realtime.TranslatedString.encode(message.causeDetail, writer.uint32(
              /* id 17, wireType 2 =*/
              138
            ).fork()).ldelim();
          if (message.effectDetail != null && Object.hasOwnProperty.call(message, "effectDetail"))
            $root.transit_realtime.TranslatedString.encode(message.effectDetail, writer.uint32(
              /* id 18, wireType 2 =*/
              146
            ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        Alert.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        Alert.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.Alert();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if (!(message.activePeriod && message.activePeriod.length))
                  message.activePeriod = [];
                message.activePeriod.push($root.transit_realtime.TimeRange.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if (!(message.communicationPeriod && message.communicationPeriod.length))
                  message.communicationPeriod = [];
                message.communicationPeriod.push($root.transit_realtime.TimeRange.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if (!(message.impactPeriod && message.impactPeriod.length))
                  message.impactPeriod = [];
                message.impactPeriod.push($root.transit_realtime.TimeRange.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                if (!(message.informedEntity && message.informedEntity.length))
                  message.informedEntity = [];
                message.informedEntity.push($root.transit_realtime.EntitySelector.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                message.cause = reader.int32();
                continue;
              }
              case 7: {
                if (wireType !== 0)
                  break;
                message.effect = reader.int32();
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                message.url = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.url);
                continue;
              }
              case 10: {
                if (wireType !== 2)
                  break;
                message.headerText = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.headerText);
                continue;
              }
              case 11: {
                if (wireType !== 2)
                  break;
                message.descriptionText = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.descriptionText);
                continue;
              }
              case 12: {
                if (wireType !== 2)
                  break;
                message.ttsHeaderText = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.ttsHeaderText);
                continue;
              }
              case 13: {
                if (wireType !== 2)
                  break;
                message.ttsDescriptionText = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.ttsDescriptionText);
                continue;
              }
              case 14: {
                if (wireType !== 0)
                  break;
                message.severityLevel = reader.int32();
                continue;
              }
              case 15: {
                if (wireType !== 2)
                  break;
                message.image = $root.transit_realtime.TranslatedImage.decode(reader, reader.uint32(), void 0, _depth + 1, message.image);
                continue;
              }
              case 16: {
                if (wireType !== 2)
                  break;
                message.imageAlternativeText = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.imageAlternativeText);
                continue;
              }
              case 17: {
                if (wireType !== 2)
                  break;
                message.causeDetail = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.causeDetail);
                continue;
              }
              case 18: {
                if (wireType !== 2)
                  break;
                message.effectDetail = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.effectDetail);
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        Alert.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        Alert.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.activePeriod != null && message.hasOwnProperty("activePeriod")) {
            if (!Array.isArray(message.activePeriod))
              return "activePeriod: array expected";
            for (var i = 0; i < message.activePeriod.length; ++i) {
              var error = $root.transit_realtime.TimeRange.verify(message.activePeriod[i], _depth + 1);
              if (error)
                return "activePeriod." + error;
            }
          }
          if (message.communicationPeriod != null && message.hasOwnProperty("communicationPeriod")) {
            if (!Array.isArray(message.communicationPeriod))
              return "communicationPeriod: array expected";
            for (var i = 0; i < message.communicationPeriod.length; ++i) {
              var error = $root.transit_realtime.TimeRange.verify(message.communicationPeriod[i], _depth + 1);
              if (error)
                return "communicationPeriod." + error;
            }
          }
          if (message.impactPeriod != null && message.hasOwnProperty("impactPeriod")) {
            if (!Array.isArray(message.impactPeriod))
              return "impactPeriod: array expected";
            for (var i = 0; i < message.impactPeriod.length; ++i) {
              var error = $root.transit_realtime.TimeRange.verify(message.impactPeriod[i], _depth + 1);
              if (error)
                return "impactPeriod." + error;
            }
          }
          if (message.informedEntity != null && message.hasOwnProperty("informedEntity")) {
            if (!Array.isArray(message.informedEntity))
              return "informedEntity: array expected";
            for (var i = 0; i < message.informedEntity.length; ++i) {
              var error = $root.transit_realtime.EntitySelector.verify(message.informedEntity[i], _depth + 1);
              if (error)
                return "informedEntity." + error;
            }
          }
          if (message.cause != null && message.hasOwnProperty("cause"))
            switch (message.cause) {
              default:
                return "cause: enum value expected";
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
              case 6:
              case 7:
              case 8:
              case 9:
              case 10:
              case 11:
              case 12:
              case 13:
                break;
            }
          if (message.effect != null && message.hasOwnProperty("effect"))
            switch (message.effect) {
              default:
                return "effect: enum value expected";
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
              case 6:
              case 7:
              case 8:
              case 9:
              case 10:
              case 11:
                break;
            }
          if (message.url != null && message.hasOwnProperty("url")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.url, _depth + 1);
            if (error)
              return "url." + error;
          }
          if (message.headerText != null && message.hasOwnProperty("headerText")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.headerText, _depth + 1);
            if (error)
              return "headerText." + error;
          }
          if (message.descriptionText != null && message.hasOwnProperty("descriptionText")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.descriptionText, _depth + 1);
            if (error)
              return "descriptionText." + error;
          }
          if (message.ttsHeaderText != null && message.hasOwnProperty("ttsHeaderText")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.ttsHeaderText, _depth + 1);
            if (error)
              return "ttsHeaderText." + error;
          }
          if (message.ttsDescriptionText != null && message.hasOwnProperty("ttsDescriptionText")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.ttsDescriptionText, _depth + 1);
            if (error)
              return "ttsDescriptionText." + error;
          }
          if (message.severityLevel != null && message.hasOwnProperty("severityLevel"))
            switch (message.severityLevel) {
              default:
                return "severityLevel: enum value expected";
              case 1:
              case 2:
              case 3:
              case 4:
                break;
            }
          if (message.image != null && message.hasOwnProperty("image")) {
            var error = $root.transit_realtime.TranslatedImage.verify(message.image, _depth + 1);
            if (error)
              return "image." + error;
          }
          if (message.imageAlternativeText != null && message.hasOwnProperty("imageAlternativeText")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.imageAlternativeText, _depth + 1);
            if (error)
              return "imageAlternativeText." + error;
          }
          if (message.causeDetail != null && message.hasOwnProperty("causeDetail")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.causeDetail, _depth + 1);
            if (error)
              return "causeDetail." + error;
          }
          if (message.effectDetail != null && message.hasOwnProperty("effectDetail")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.effectDetail, _depth + 1);
            if (error)
              return "effectDetail." + error;
          }
          return null;
        };
        Alert.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.Alert)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.Alert();
          if (object.activePeriod) {
            if (!Array.isArray(object.activePeriod))
              throw TypeError(".transit_realtime.Alert.activePeriod: array expected");
            message.activePeriod = Array(object.activePeriod.length);
            for (var i = 0; i < object.activePeriod.length; ++i) {
              if (typeof object.activePeriod[i] !== "object")
                throw TypeError(".transit_realtime.Alert.activePeriod: object expected");
              message.activePeriod[i] = $root.transit_realtime.TimeRange.fromObject(object.activePeriod[i], _depth + 1);
            }
          }
          if (object.communicationPeriod) {
            if (!Array.isArray(object.communicationPeriod))
              throw TypeError(".transit_realtime.Alert.communicationPeriod: array expected");
            message.communicationPeriod = Array(object.communicationPeriod.length);
            for (var i = 0; i < object.communicationPeriod.length; ++i) {
              if (typeof object.communicationPeriod[i] !== "object")
                throw TypeError(".transit_realtime.Alert.communicationPeriod: object expected");
              message.communicationPeriod[i] = $root.transit_realtime.TimeRange.fromObject(object.communicationPeriod[i], _depth + 1);
            }
          }
          if (object.impactPeriod) {
            if (!Array.isArray(object.impactPeriod))
              throw TypeError(".transit_realtime.Alert.impactPeriod: array expected");
            message.impactPeriod = Array(object.impactPeriod.length);
            for (var i = 0; i < object.impactPeriod.length; ++i) {
              if (typeof object.impactPeriod[i] !== "object")
                throw TypeError(".transit_realtime.Alert.impactPeriod: object expected");
              message.impactPeriod[i] = $root.transit_realtime.TimeRange.fromObject(object.impactPeriod[i], _depth + 1);
            }
          }
          if (object.informedEntity) {
            if (!Array.isArray(object.informedEntity))
              throw TypeError(".transit_realtime.Alert.informedEntity: array expected");
            message.informedEntity = Array(object.informedEntity.length);
            for (var i = 0; i < object.informedEntity.length; ++i) {
              if (typeof object.informedEntity[i] !== "object")
                throw TypeError(".transit_realtime.Alert.informedEntity: object expected");
              message.informedEntity[i] = $root.transit_realtime.EntitySelector.fromObject(object.informedEntity[i], _depth + 1);
            }
          }
          switch (object.cause) {
            default:
              if (typeof object.cause === "number") {
                message.cause = object.cause;
                break;
              }
              break;
            case "UNKNOWN_CAUSE":
            case 1:
              message.cause = 1;
              break;
            case "OTHER_CAUSE":
            case 2:
              message.cause = 2;
              break;
            case "TECHNICAL_PROBLEM":
            case 3:
              message.cause = 3;
              break;
            case "STRIKE":
            case 4:
              message.cause = 4;
              break;
            case "DEMONSTRATION":
            case 5:
              message.cause = 5;
              break;
            case "ACCIDENT":
            case 6:
              message.cause = 6;
              break;
            case "HOLIDAY":
            case 7:
              message.cause = 7;
              break;
            case "WEATHER":
            case 8:
              message.cause = 8;
              break;
            case "MAINTENANCE":
            case 9:
              message.cause = 9;
              break;
            case "CONSTRUCTION":
            case 10:
              message.cause = 10;
              break;
            case "POLICE_ACTIVITY":
            case 11:
              message.cause = 11;
              break;
            case "MEDICAL_EMERGENCY":
            case 12:
              message.cause = 12;
              break;
            case "SPECIAL_EVENT":
            case 13:
              message.cause = 13;
              break;
          }
          switch (object.effect) {
            case "NO_SERVICE":
            case 1:
              message.effect = 1;
              break;
            case "REDUCED_SERVICE":
            case 2:
              message.effect = 2;
              break;
            case "SIGNIFICANT_DELAYS":
            case 3:
              message.effect = 3;
              break;
            case "DETOUR":
            case 4:
              message.effect = 4;
              break;
            case "ADDITIONAL_SERVICE":
            case 5:
              message.effect = 5;
              break;
            case "MODIFIED_SERVICE":
            case 6:
              message.effect = 6;
              break;
            case "OTHER_EFFECT":
            case 7:
              message.effect = 7;
              break;
            default:
              if (typeof object.effect === "number") {
                message.effect = object.effect;
                break;
              }
              break;
            case "UNKNOWN_EFFECT":
            case 8:
              message.effect = 8;
              break;
            case "STOP_MOVED":
            case 9:
              message.effect = 9;
              break;
            case "NO_EFFECT":
            case 10:
              message.effect = 10;
              break;
            case "ACCESSIBILITY_ISSUE":
            case 11:
              message.effect = 11;
              break;
          }
          if (object.url != null) {
            if (typeof object.url !== "object")
              throw TypeError(".transit_realtime.Alert.url: object expected");
            message.url = $root.transit_realtime.TranslatedString.fromObject(object.url, _depth + 1);
          }
          if (object.headerText != null) {
            if (typeof object.headerText !== "object")
              throw TypeError(".transit_realtime.Alert.headerText: object expected");
            message.headerText = $root.transit_realtime.TranslatedString.fromObject(object.headerText, _depth + 1);
          }
          if (object.descriptionText != null) {
            if (typeof object.descriptionText !== "object")
              throw TypeError(".transit_realtime.Alert.descriptionText: object expected");
            message.descriptionText = $root.transit_realtime.TranslatedString.fromObject(object.descriptionText, _depth + 1);
          }
          if (object.ttsHeaderText != null) {
            if (typeof object.ttsHeaderText !== "object")
              throw TypeError(".transit_realtime.Alert.ttsHeaderText: object expected");
            message.ttsHeaderText = $root.transit_realtime.TranslatedString.fromObject(object.ttsHeaderText, _depth + 1);
          }
          if (object.ttsDescriptionText != null) {
            if (typeof object.ttsDescriptionText !== "object")
              throw TypeError(".transit_realtime.Alert.ttsDescriptionText: object expected");
            message.ttsDescriptionText = $root.transit_realtime.TranslatedString.fromObject(object.ttsDescriptionText, _depth + 1);
          }
          switch (object.severityLevel) {
            default:
              if (typeof object.severityLevel === "number") {
                message.severityLevel = object.severityLevel;
                break;
              }
              break;
            case "UNKNOWN_SEVERITY":
            case 1:
              message.severityLevel = 1;
              break;
            case "INFO":
            case 2:
              message.severityLevel = 2;
              break;
            case "WARNING":
            case 3:
              message.severityLevel = 3;
              break;
            case "SEVERE":
            case 4:
              message.severityLevel = 4;
              break;
          }
          if (object.image != null) {
            if (typeof object.image !== "object")
              throw TypeError(".transit_realtime.Alert.image: object expected");
            message.image = $root.transit_realtime.TranslatedImage.fromObject(object.image, _depth + 1);
          }
          if (object.imageAlternativeText != null) {
            if (typeof object.imageAlternativeText !== "object")
              throw TypeError(".transit_realtime.Alert.imageAlternativeText: object expected");
            message.imageAlternativeText = $root.transit_realtime.TranslatedString.fromObject(object.imageAlternativeText, _depth + 1);
          }
          if (object.causeDetail != null) {
            if (typeof object.causeDetail !== "object")
              throw TypeError(".transit_realtime.Alert.causeDetail: object expected");
            message.causeDetail = $root.transit_realtime.TranslatedString.fromObject(object.causeDetail, _depth + 1);
          }
          if (object.effectDetail != null) {
            if (typeof object.effectDetail !== "object")
              throw TypeError(".transit_realtime.Alert.effectDetail: object expected");
            message.effectDetail = $root.transit_realtime.TranslatedString.fromObject(object.effectDetail, _depth + 1);
          }
          return message;
        };
        Alert.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.activePeriod = [];
            object.communicationPeriod = [];
            object.impactPeriod = [];
            object.informedEntity = [];
          }
          if (options.defaults) {
            object.cause = options.enums === String ? "UNKNOWN_CAUSE" : 1;
            object.effect = options.enums === String ? "UNKNOWN_EFFECT" : 8;
            object.url = null;
            object.headerText = null;
            object.descriptionText = null;
            object.ttsHeaderText = null;
            object.ttsDescriptionText = null;
            object.severityLevel = options.enums === String ? "UNKNOWN_SEVERITY" : 1;
            object.image = null;
            object.imageAlternativeText = null;
            object.causeDetail = null;
            object.effectDetail = null;
          }
          if (message.activePeriod && message.activePeriod.length) {
            object.activePeriod = Array(message.activePeriod.length);
            for (var j = 0; j < message.activePeriod.length; ++j)
              object.activePeriod[j] = $root.transit_realtime.TimeRange.toObject(message.activePeriod[j], options);
          }
          if (message.communicationPeriod && message.communicationPeriod.length) {
            object.communicationPeriod = Array(message.communicationPeriod.length);
            for (var j = 0; j < message.communicationPeriod.length; ++j)
              object.communicationPeriod[j] = $root.transit_realtime.TimeRange.toObject(message.communicationPeriod[j], options);
          }
          if (message.impactPeriod && message.impactPeriod.length) {
            object.impactPeriod = Array(message.impactPeriod.length);
            for (var j = 0; j < message.impactPeriod.length; ++j)
              object.impactPeriod[j] = $root.transit_realtime.TimeRange.toObject(message.impactPeriod[j], options);
          }
          if (message.informedEntity && message.informedEntity.length) {
            object.informedEntity = Array(message.informedEntity.length);
            for (var j = 0; j < message.informedEntity.length; ++j)
              object.informedEntity[j] = $root.transit_realtime.EntitySelector.toObject(message.informedEntity[j], options);
          }
          if (message.cause != null && message.hasOwnProperty("cause"))
            object.cause = options.enums === String ? $root.transit_realtime.Alert.Cause[message.cause] === void 0 ? message.cause : $root.transit_realtime.Alert.Cause[message.cause] : message.cause;
          if (message.effect != null && message.hasOwnProperty("effect"))
            object.effect = options.enums === String ? $root.transit_realtime.Alert.Effect[message.effect] === void 0 ? message.effect : $root.transit_realtime.Alert.Effect[message.effect] : message.effect;
          if (message.url != null && message.hasOwnProperty("url"))
            object.url = $root.transit_realtime.TranslatedString.toObject(message.url, options);
          if (message.headerText != null && message.hasOwnProperty("headerText"))
            object.headerText = $root.transit_realtime.TranslatedString.toObject(message.headerText, options);
          if (message.descriptionText != null && message.hasOwnProperty("descriptionText"))
            object.descriptionText = $root.transit_realtime.TranslatedString.toObject(message.descriptionText, options);
          if (message.ttsHeaderText != null && message.hasOwnProperty("ttsHeaderText"))
            object.ttsHeaderText = $root.transit_realtime.TranslatedString.toObject(message.ttsHeaderText, options);
          if (message.ttsDescriptionText != null && message.hasOwnProperty("ttsDescriptionText"))
            object.ttsDescriptionText = $root.transit_realtime.TranslatedString.toObject(message.ttsDescriptionText, options);
          if (message.severityLevel != null && message.hasOwnProperty("severityLevel"))
            object.severityLevel = options.enums === String ? $root.transit_realtime.Alert.SeverityLevel[message.severityLevel] === void 0 ? message.severityLevel : $root.transit_realtime.Alert.SeverityLevel[message.severityLevel] : message.severityLevel;
          if (message.image != null && message.hasOwnProperty("image"))
            object.image = $root.transit_realtime.TranslatedImage.toObject(message.image, options);
          if (message.imageAlternativeText != null && message.hasOwnProperty("imageAlternativeText"))
            object.imageAlternativeText = $root.transit_realtime.TranslatedString.toObject(message.imageAlternativeText, options);
          if (message.causeDetail != null && message.hasOwnProperty("causeDetail"))
            object.causeDetail = $root.transit_realtime.TranslatedString.toObject(message.causeDetail, options);
          if (message.effectDetail != null && message.hasOwnProperty("effectDetail"))
            object.effectDetail = $root.transit_realtime.TranslatedString.toObject(message.effectDetail, options);
          return object;
        };
        Alert.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        Alert.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.Alert";
        };
        Alert.Cause = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[1] = "UNKNOWN_CAUSE"] = 1;
          values[valuesById[2] = "OTHER_CAUSE"] = 2;
          values[valuesById[3] = "TECHNICAL_PROBLEM"] = 3;
          values[valuesById[4] = "STRIKE"] = 4;
          values[valuesById[5] = "DEMONSTRATION"] = 5;
          values[valuesById[6] = "ACCIDENT"] = 6;
          values[valuesById[7] = "HOLIDAY"] = 7;
          values[valuesById[8] = "WEATHER"] = 8;
          values[valuesById[9] = "MAINTENANCE"] = 9;
          values[valuesById[10] = "CONSTRUCTION"] = 10;
          values[valuesById[11] = "POLICE_ACTIVITY"] = 11;
          values[valuesById[12] = "MEDICAL_EMERGENCY"] = 12;
          values[valuesById[13] = "SPECIAL_EVENT"] = 13;
          return values;
        })();
        Alert.Effect = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[1] = "NO_SERVICE"] = 1;
          values[valuesById[2] = "REDUCED_SERVICE"] = 2;
          values[valuesById[3] = "SIGNIFICANT_DELAYS"] = 3;
          values[valuesById[4] = "DETOUR"] = 4;
          values[valuesById[5] = "ADDITIONAL_SERVICE"] = 5;
          values[valuesById[6] = "MODIFIED_SERVICE"] = 6;
          values[valuesById[7] = "OTHER_EFFECT"] = 7;
          values[valuesById[8] = "UNKNOWN_EFFECT"] = 8;
          values[valuesById[9] = "STOP_MOVED"] = 9;
          values[valuesById[10] = "NO_EFFECT"] = 10;
          values[valuesById[11] = "ACCESSIBILITY_ISSUE"] = 11;
          return values;
        })();
        Alert.SeverityLevel = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[1] = "UNKNOWN_SEVERITY"] = 1;
          values[valuesById[2] = "INFO"] = 2;
          values[valuesById[3] = "WARNING"] = 3;
          values[valuesById[4] = "SEVERE"] = 4;
          return values;
        })();
        return Alert;
      })();
      transit_realtime2.TimeRange = (function() {
        function TimeRange(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TimeRange.prototype.start = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
        TimeRange.prototype.end = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
        TimeRange.create = function create(properties) {
          return new TimeRange(properties);
        };
        TimeRange.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.start != null && Object.hasOwnProperty.call(message, "start"))
            writer.uint32(
              /* id 1, wireType 0 =*/
              8
            ).uint64(message.start);
          if (message.end != null && Object.hasOwnProperty.call(message, "end"))
            writer.uint32(
              /* id 2, wireType 0 =*/
              16
            ).uint64(message.end);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TimeRange.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TimeRange.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TimeRange();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 0)
                  break;
                message.start = reader.uint64();
                continue;
              }
              case 2: {
                if (wireType !== 0)
                  break;
                message.end = reader.uint64();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        TimeRange.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TimeRange.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.start != null && message.hasOwnProperty("start")) {
            if (!$util.isInteger(message.start) && !(message.start && $util.isInteger(message.start.low) && $util.isInteger(message.start.high)))
              return "start: integer|Long expected";
          }
          if (message.end != null && message.hasOwnProperty("end")) {
            if (!$util.isInteger(message.end) && !(message.end && $util.isInteger(message.end.low) && $util.isInteger(message.end.high)))
              return "end: integer|Long expected";
          }
          return null;
        };
        TimeRange.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TimeRange)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TimeRange();
          if (object.start != null) {
            if ($util.Long)
              (message.start = $util.Long.fromValue(object.start)).unsigned = true;
            else if (typeof object.start === "string")
              message.start = parseInt(object.start, 10);
            else if (typeof object.start === "number")
              message.start = object.start;
            else if (typeof object.start === "object")
              message.start = new $util.LongBits(object.start.low >>> 0, object.start.high >>> 0).toNumber(true);
          }
          if (object.end != null) {
            if ($util.Long)
              (message.end = $util.Long.fromValue(object.end)).unsigned = true;
            else if (typeof object.end === "string")
              message.end = parseInt(object.end, 10);
            else if (typeof object.end === "number")
              message.end = object.end;
            else if (typeof object.end === "object")
              message.end = new $util.LongBits(object.end.low >>> 0, object.end.high >>> 0).toNumber(true);
          }
          return message;
        };
        TimeRange.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.start = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
              object.start = options.longs === String ? "0" : 0;
            if ($util.Long) {
              var long = new $util.Long(0, 0, true);
              object.end = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
              object.end = options.longs === String ? "0" : 0;
          }
          if (message.start != null && message.hasOwnProperty("start"))
            if (typeof message.start === "number")
              object.start = options.longs === String ? String(message.start) : message.start;
            else
              object.start = options.longs === String ? $util.Long.prototype.toString.call(message.start) : options.longs === Number ? new $util.LongBits(message.start.low >>> 0, message.start.high >>> 0).toNumber(true) : message.start;
          if (message.end != null && message.hasOwnProperty("end"))
            if (typeof message.end === "number")
              object.end = options.longs === String ? String(message.end) : message.end;
            else
              object.end = options.longs === String ? $util.Long.prototype.toString.call(message.end) : options.longs === Number ? new $util.LongBits(message.end.low >>> 0, message.end.high >>> 0).toNumber(true) : message.end;
          return object;
        };
        TimeRange.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TimeRange.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TimeRange";
        };
        return TimeRange;
      })();
      transit_realtime2.Position = (function() {
        function Position(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        Position.prototype.latitude = 0;
        Position.prototype.longitude = 0;
        Position.prototype.bearing = 0;
        Position.prototype.odometer = 0;
        Position.prototype.speed = 0;
        Position.create = function create(properties) {
          return new Position(properties);
        };
        Position.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          writer.uint32(
            /* id 1, wireType 5 =*/
            13
          ).float(message.latitude);
          writer.uint32(
            /* id 2, wireType 5 =*/
            21
          ).float(message.longitude);
          if (message.bearing != null && Object.hasOwnProperty.call(message, "bearing"))
            writer.uint32(
              /* id 3, wireType 5 =*/
              29
            ).float(message.bearing);
          if (message.odometer != null && Object.hasOwnProperty.call(message, "odometer"))
            writer.uint32(
              /* id 4, wireType 1 =*/
              33
            ).double(message.odometer);
          if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
            writer.uint32(
              /* id 5, wireType 5 =*/
              45
            ).float(message.speed);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        Position.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        Position.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.Position();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 5)
                  break;
                message.latitude = reader.float();
                continue;
              }
              case 2: {
                if (wireType !== 5)
                  break;
                message.longitude = reader.float();
                continue;
              }
              case 3: {
                if (wireType !== 5)
                  break;
                message.bearing = reader.float();
                continue;
              }
              case 4: {
                if (wireType !== 1)
                  break;
                message.odometer = reader.double();
                continue;
              }
              case 5: {
                if (wireType !== 5)
                  break;
                message.speed = reader.float();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          if (!message.hasOwnProperty("latitude"))
            throw $util.ProtocolError("missing required 'latitude'", { instance: message });
          if (!message.hasOwnProperty("longitude"))
            throw $util.ProtocolError("missing required 'longitude'", { instance: message });
          return message;
        };
        Position.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        Position.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (typeof message.latitude !== "number")
            return "latitude: number expected";
          if (typeof message.longitude !== "number")
            return "longitude: number expected";
          if (message.bearing != null && message.hasOwnProperty("bearing")) {
            if (typeof message.bearing !== "number")
              return "bearing: number expected";
          }
          if (message.odometer != null && message.hasOwnProperty("odometer")) {
            if (typeof message.odometer !== "number")
              return "odometer: number expected";
          }
          if (message.speed != null && message.hasOwnProperty("speed")) {
            if (typeof message.speed !== "number")
              return "speed: number expected";
          }
          return null;
        };
        Position.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.Position)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.Position();
          if (object.latitude != null)
            message.latitude = Number(object.latitude);
          if (object.longitude != null)
            message.longitude = Number(object.longitude);
          if (object.bearing != null)
            message.bearing = Number(object.bearing);
          if (object.odometer != null)
            message.odometer = Number(object.odometer);
          if (object.speed != null)
            message.speed = Number(object.speed);
          return message;
        };
        Position.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.latitude = 0;
            object.longitude = 0;
            object.bearing = 0;
            object.odometer = 0;
            object.speed = 0;
          }
          if (message.latitude != null && message.hasOwnProperty("latitude"))
            object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
          if (message.longitude != null && message.hasOwnProperty("longitude"))
            object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
          if (message.bearing != null && message.hasOwnProperty("bearing"))
            object.bearing = options.json && !isFinite(message.bearing) ? String(message.bearing) : message.bearing;
          if (message.odometer != null && message.hasOwnProperty("odometer"))
            object.odometer = options.json && !isFinite(message.odometer) ? String(message.odometer) : message.odometer;
          if (message.speed != null && message.hasOwnProperty("speed"))
            object.speed = options.json && !isFinite(message.speed) ? String(message.speed) : message.speed;
          return object;
        };
        Position.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        Position.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.Position";
        };
        return Position;
      })();
      transit_realtime2.TripDescriptor = (function() {
        function TripDescriptor(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TripDescriptor.prototype.tripId = "";
        TripDescriptor.prototype.routeId = "";
        TripDescriptor.prototype.directionId = 0;
        TripDescriptor.prototype.startTime = "";
        TripDescriptor.prototype.startDate = "";
        TripDescriptor.prototype.scheduleRelationship = 0;
        TripDescriptor.prototype.modifiedTrip = null;
        TripDescriptor.create = function create(properties) {
          return new TripDescriptor(properties);
        };
        TripDescriptor.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.tripId != null && Object.hasOwnProperty.call(message, "tripId"))
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.tripId);
          if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.startTime);
          if (message.startDate != null && Object.hasOwnProperty.call(message, "startDate"))
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.startDate);
          if (message.scheduleRelationship != null && Object.hasOwnProperty.call(message, "scheduleRelationship"))
            writer.uint32(
              /* id 4, wireType 0 =*/
              32
            ).int32(message.scheduleRelationship);
          if (message.routeId != null && Object.hasOwnProperty.call(message, "routeId"))
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.routeId);
          if (message.directionId != null && Object.hasOwnProperty.call(message, "directionId"))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).uint32(message.directionId);
          if (message.modifiedTrip != null && Object.hasOwnProperty.call(message, "modifiedTrip"))
            $root.transit_realtime.TripDescriptor.ModifiedTripSelector.encode(message.modifiedTrip, writer.uint32(
              /* id 7, wireType 2 =*/
              58
            ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TripDescriptor.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TripDescriptor.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripDescriptor();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.tripId = reader.string();
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                message.routeId = reader.string();
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                message.directionId = reader.uint32();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.startTime = reader.string();
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                message.startDate = reader.string();
                continue;
              }
              case 4: {
                if (wireType !== 0)
                  break;
                message.scheduleRelationship = reader.int32();
                continue;
              }
              case 7: {
                if (wireType !== 2)
                  break;
                message.modifiedTrip = $root.transit_realtime.TripDescriptor.ModifiedTripSelector.decode(reader, reader.uint32(), void 0, _depth + 1, message.modifiedTrip);
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        TripDescriptor.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TripDescriptor.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.tripId != null && message.hasOwnProperty("tripId")) {
            if (!$util.isString(message.tripId))
              return "tripId: string expected";
          }
          if (message.routeId != null && message.hasOwnProperty("routeId")) {
            if (!$util.isString(message.routeId))
              return "routeId: string expected";
          }
          if (message.directionId != null && message.hasOwnProperty("directionId")) {
            if (!$util.isInteger(message.directionId))
              return "directionId: integer expected";
          }
          if (message.startTime != null && message.hasOwnProperty("startTime")) {
            if (!$util.isString(message.startTime))
              return "startTime: string expected";
          }
          if (message.startDate != null && message.hasOwnProperty("startDate")) {
            if (!$util.isString(message.startDate))
              return "startDate: string expected";
          }
          if (message.scheduleRelationship != null && message.hasOwnProperty("scheduleRelationship"))
            switch (message.scheduleRelationship) {
              default:
                return "scheduleRelationship: enum value expected";
              case 0:
              case 1:
              case 2:
              case 3:
              case 5:
              case 6:
              case 7:
              case 8:
                break;
            }
          if (message.modifiedTrip != null && message.hasOwnProperty("modifiedTrip")) {
            var error = $root.transit_realtime.TripDescriptor.ModifiedTripSelector.verify(message.modifiedTrip, _depth + 1);
            if (error)
              return "modifiedTrip." + error;
          }
          return null;
        };
        TripDescriptor.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TripDescriptor)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TripDescriptor();
          if (object.tripId != null)
            message.tripId = String(object.tripId);
          if (object.routeId != null)
            message.routeId = String(object.routeId);
          if (object.directionId != null)
            message.directionId = object.directionId >>> 0;
          if (object.startTime != null)
            message.startTime = String(object.startTime);
          if (object.startDate != null)
            message.startDate = String(object.startDate);
          switch (object.scheduleRelationship) {
            default:
              if (typeof object.scheduleRelationship === "number") {
                message.scheduleRelationship = object.scheduleRelationship;
                break;
              }
              break;
            case "SCHEDULED":
            case 0:
              message.scheduleRelationship = 0;
              break;
            case "ADDED":
            case 1:
              message.scheduleRelationship = 1;
              break;
            case "UNSCHEDULED":
            case 2:
              message.scheduleRelationship = 2;
              break;
            case "CANCELED":
            case 3:
              message.scheduleRelationship = 3;
              break;
            case "REPLACEMENT":
            case 5:
              message.scheduleRelationship = 5;
              break;
            case "DUPLICATED":
            case 6:
              message.scheduleRelationship = 6;
              break;
            case "DELETED":
            case 7:
              message.scheduleRelationship = 7;
              break;
            case "NEW":
            case 8:
              message.scheduleRelationship = 8;
              break;
          }
          if (object.modifiedTrip != null) {
            if (typeof object.modifiedTrip !== "object")
              throw TypeError(".transit_realtime.TripDescriptor.modifiedTrip: object expected");
            message.modifiedTrip = $root.transit_realtime.TripDescriptor.ModifiedTripSelector.fromObject(object.modifiedTrip, _depth + 1);
          }
          return message;
        };
        TripDescriptor.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.tripId = "";
            object.startTime = "";
            object.startDate = "";
            object.scheduleRelationship = options.enums === String ? "SCHEDULED" : 0;
            object.routeId = "";
            object.directionId = 0;
            object.modifiedTrip = null;
          }
          if (message.tripId != null && message.hasOwnProperty("tripId"))
            object.tripId = message.tripId;
          if (message.startTime != null && message.hasOwnProperty("startTime"))
            object.startTime = message.startTime;
          if (message.startDate != null && message.hasOwnProperty("startDate"))
            object.startDate = message.startDate;
          if (message.scheduleRelationship != null && message.hasOwnProperty("scheduleRelationship"))
            object.scheduleRelationship = options.enums === String ? $root.transit_realtime.TripDescriptor.ScheduleRelationship[message.scheduleRelationship] === void 0 ? message.scheduleRelationship : $root.transit_realtime.TripDescriptor.ScheduleRelationship[message.scheduleRelationship] : message.scheduleRelationship;
          if (message.routeId != null && message.hasOwnProperty("routeId"))
            object.routeId = message.routeId;
          if (message.directionId != null && message.hasOwnProperty("directionId"))
            object.directionId = message.directionId;
          if (message.modifiedTrip != null && message.hasOwnProperty("modifiedTrip"))
            object.modifiedTrip = $root.transit_realtime.TripDescriptor.ModifiedTripSelector.toObject(message.modifiedTrip, options);
          return object;
        };
        TripDescriptor.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TripDescriptor.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TripDescriptor";
        };
        TripDescriptor.ScheduleRelationship = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "SCHEDULED"] = 0;
          values[valuesById[1] = "ADDED"] = 1;
          values[valuesById[2] = "UNSCHEDULED"] = 2;
          values[valuesById[3] = "CANCELED"] = 3;
          values[valuesById[5] = "REPLACEMENT"] = 5;
          values[valuesById[6] = "DUPLICATED"] = 6;
          values[valuesById[7] = "DELETED"] = 7;
          values[valuesById[8] = "NEW"] = 8;
          return values;
        })();
        TripDescriptor.ModifiedTripSelector = (function() {
          function ModifiedTripSelector(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          ModifiedTripSelector.prototype.modificationsId = "";
          ModifiedTripSelector.prototype.affectedTripId = "";
          ModifiedTripSelector.prototype.startTime = "";
          ModifiedTripSelector.prototype.startDate = "";
          ModifiedTripSelector.create = function create(properties) {
            return new ModifiedTripSelector(properties);
          };
          ModifiedTripSelector.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.modificationsId != null && Object.hasOwnProperty.call(message, "modificationsId"))
              writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).string(message.modificationsId);
            if (message.affectedTripId != null && Object.hasOwnProperty.call(message, "affectedTripId"))
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.affectedTripId);
            if (message.startTime != null && Object.hasOwnProperty.call(message, "startTime"))
              writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).string(message.startTime);
            if (message.startDate != null && Object.hasOwnProperty.call(message, "startDate"))
              writer.uint32(
                /* id 4, wireType 2 =*/
                34
              ).string(message.startDate);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          ModifiedTripSelector.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          ModifiedTripSelector.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripDescriptor.ModifiedTripSelector();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.modificationsId = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.affectedTripId = reader.string();
                  continue;
                }
                case 3: {
                  if (wireType !== 2)
                    break;
                  message.startTime = reader.string();
                  continue;
                }
                case 4: {
                  if (wireType !== 2)
                    break;
                  message.startDate = reader.string();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          ModifiedTripSelector.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          ModifiedTripSelector.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.modificationsId != null && message.hasOwnProperty("modificationsId")) {
              if (!$util.isString(message.modificationsId))
                return "modificationsId: string expected";
            }
            if (message.affectedTripId != null && message.hasOwnProperty("affectedTripId")) {
              if (!$util.isString(message.affectedTripId))
                return "affectedTripId: string expected";
            }
            if (message.startTime != null && message.hasOwnProperty("startTime")) {
              if (!$util.isString(message.startTime))
                return "startTime: string expected";
            }
            if (message.startDate != null && message.hasOwnProperty("startDate")) {
              if (!$util.isString(message.startDate))
                return "startDate: string expected";
            }
            return null;
          };
          ModifiedTripSelector.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripDescriptor.ModifiedTripSelector)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripDescriptor.ModifiedTripSelector();
            if (object.modificationsId != null)
              message.modificationsId = String(object.modificationsId);
            if (object.affectedTripId != null)
              message.affectedTripId = String(object.affectedTripId);
            if (object.startTime != null)
              message.startTime = String(object.startTime);
            if (object.startDate != null)
              message.startDate = String(object.startDate);
            return message;
          };
          ModifiedTripSelector.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.modificationsId = "";
              object.affectedTripId = "";
              object.startTime = "";
              object.startDate = "";
            }
            if (message.modificationsId != null && message.hasOwnProperty("modificationsId"))
              object.modificationsId = message.modificationsId;
            if (message.affectedTripId != null && message.hasOwnProperty("affectedTripId"))
              object.affectedTripId = message.affectedTripId;
            if (message.startTime != null && message.hasOwnProperty("startTime"))
              object.startTime = message.startTime;
            if (message.startDate != null && message.hasOwnProperty("startDate"))
              object.startDate = message.startDate;
            return object;
          };
          ModifiedTripSelector.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          ModifiedTripSelector.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripDescriptor.ModifiedTripSelector";
          };
          return ModifiedTripSelector;
        })();
        return TripDescriptor;
      })();
      transit_realtime2.VehicleDescriptor = (function() {
        function VehicleDescriptor(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        VehicleDescriptor.prototype.id = "";
        VehicleDescriptor.prototype.label = "";
        VehicleDescriptor.prototype.licensePlate = "";
        VehicleDescriptor.prototype.wheelchairAccessible = 0;
        VehicleDescriptor.create = function create(properties) {
          return new VehicleDescriptor(properties);
        };
        VehicleDescriptor.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.id);
          if (message.label != null && Object.hasOwnProperty.call(message, "label"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.label);
          if (message.licensePlate != null && Object.hasOwnProperty.call(message, "licensePlate"))
            writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).string(message.licensePlate);
          if (message.wheelchairAccessible != null && Object.hasOwnProperty.call(message, "wheelchairAccessible"))
            writer.uint32(
              /* id 4, wireType 0 =*/
              32
            ).int32(message.wheelchairAccessible);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        VehicleDescriptor.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        VehicleDescriptor.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.VehicleDescriptor();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.id = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.label = reader.string();
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                message.licensePlate = reader.string();
                continue;
              }
              case 4: {
                if (wireType !== 0)
                  break;
                message.wheelchairAccessible = reader.int32();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        VehicleDescriptor.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        VehicleDescriptor.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.id != null && message.hasOwnProperty("id")) {
            if (!$util.isString(message.id))
              return "id: string expected";
          }
          if (message.label != null && message.hasOwnProperty("label")) {
            if (!$util.isString(message.label))
              return "label: string expected";
          }
          if (message.licensePlate != null && message.hasOwnProperty("licensePlate")) {
            if (!$util.isString(message.licensePlate))
              return "licensePlate: string expected";
          }
          if (message.wheelchairAccessible != null && message.hasOwnProperty("wheelchairAccessible"))
            switch (message.wheelchairAccessible) {
              default:
                return "wheelchairAccessible: enum value expected";
              case 0:
              case 1:
              case 2:
              case 3:
                break;
            }
          return null;
        };
        VehicleDescriptor.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.VehicleDescriptor)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.VehicleDescriptor();
          if (object.id != null)
            message.id = String(object.id);
          if (object.label != null)
            message.label = String(object.label);
          if (object.licensePlate != null)
            message.licensePlate = String(object.licensePlate);
          switch (object.wheelchairAccessible) {
            default:
              if (typeof object.wheelchairAccessible === "number") {
                message.wheelchairAccessible = object.wheelchairAccessible;
                break;
              }
              break;
            case "NO_VALUE":
            case 0:
              message.wheelchairAccessible = 0;
              break;
            case "UNKNOWN":
            case 1:
              message.wheelchairAccessible = 1;
              break;
            case "WHEELCHAIR_ACCESSIBLE":
            case 2:
              message.wheelchairAccessible = 2;
              break;
            case "WHEELCHAIR_INACCESSIBLE":
            case 3:
              message.wheelchairAccessible = 3;
              break;
          }
          return message;
        };
        VehicleDescriptor.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.id = "";
            object.label = "";
            object.licensePlate = "";
            object.wheelchairAccessible = options.enums === String ? "NO_VALUE" : 0;
          }
          if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
          if (message.label != null && message.hasOwnProperty("label"))
            object.label = message.label;
          if (message.licensePlate != null && message.hasOwnProperty("licensePlate"))
            object.licensePlate = message.licensePlate;
          if (message.wheelchairAccessible != null && message.hasOwnProperty("wheelchairAccessible"))
            object.wheelchairAccessible = options.enums === String ? $root.transit_realtime.VehicleDescriptor.WheelchairAccessible[message.wheelchairAccessible] === void 0 ? message.wheelchairAccessible : $root.transit_realtime.VehicleDescriptor.WheelchairAccessible[message.wheelchairAccessible] : message.wheelchairAccessible;
          return object;
        };
        VehicleDescriptor.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        VehicleDescriptor.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.VehicleDescriptor";
        };
        VehicleDescriptor.WheelchairAccessible = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "NO_VALUE"] = 0;
          values[valuesById[1] = "UNKNOWN"] = 1;
          values[valuesById[2] = "WHEELCHAIR_ACCESSIBLE"] = 2;
          values[valuesById[3] = "WHEELCHAIR_INACCESSIBLE"] = 3;
          return values;
        })();
        return VehicleDescriptor;
      })();
      transit_realtime2.EntitySelector = (function() {
        function EntitySelector(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        EntitySelector.prototype.agencyId = "";
        EntitySelector.prototype.routeId = "";
        EntitySelector.prototype.routeType = 0;
        EntitySelector.prototype.trip = null;
        EntitySelector.prototype.stopId = "";
        EntitySelector.prototype.directionId = 0;
        EntitySelector.create = function create(properties) {
          return new EntitySelector(properties);
        };
        EntitySelector.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.agencyId != null && Object.hasOwnProperty.call(message, "agencyId"))
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.agencyId);
          if (message.routeId != null && Object.hasOwnProperty.call(message, "routeId"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.routeId);
          if (message.routeType != null && Object.hasOwnProperty.call(message, "routeType"))
            writer.uint32(
              /* id 3, wireType 0 =*/
              24
            ).int32(message.routeType);
          if (message.trip != null && Object.hasOwnProperty.call(message, "trip"))
            $root.transit_realtime.TripDescriptor.encode(message.trip, writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).fork()).ldelim();
          if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
            writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).string(message.stopId);
          if (message.directionId != null && Object.hasOwnProperty.call(message, "directionId"))
            writer.uint32(
              /* id 6, wireType 0 =*/
              48
            ).uint32(message.directionId);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        EntitySelector.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        EntitySelector.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.EntitySelector();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.agencyId = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.routeId = reader.string();
                continue;
              }
              case 3: {
                if (wireType !== 0)
                  break;
                message.routeType = reader.int32();
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                message.trip = $root.transit_realtime.TripDescriptor.decode(reader, reader.uint32(), void 0, _depth + 1, message.trip);
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                message.stopId = reader.string();
                continue;
              }
              case 6: {
                if (wireType !== 0)
                  break;
                message.directionId = reader.uint32();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        EntitySelector.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        EntitySelector.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.agencyId != null && message.hasOwnProperty("agencyId")) {
            if (!$util.isString(message.agencyId))
              return "agencyId: string expected";
          }
          if (message.routeId != null && message.hasOwnProperty("routeId")) {
            if (!$util.isString(message.routeId))
              return "routeId: string expected";
          }
          if (message.routeType != null && message.hasOwnProperty("routeType")) {
            if (!$util.isInteger(message.routeType))
              return "routeType: integer expected";
          }
          if (message.trip != null && message.hasOwnProperty("trip")) {
            var error = $root.transit_realtime.TripDescriptor.verify(message.trip, _depth + 1);
            if (error)
              return "trip." + error;
          }
          if (message.stopId != null && message.hasOwnProperty("stopId")) {
            if (!$util.isString(message.stopId))
              return "stopId: string expected";
          }
          if (message.directionId != null && message.hasOwnProperty("directionId")) {
            if (!$util.isInteger(message.directionId))
              return "directionId: integer expected";
          }
          return null;
        };
        EntitySelector.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.EntitySelector)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.EntitySelector();
          if (object.agencyId != null)
            message.agencyId = String(object.agencyId);
          if (object.routeId != null)
            message.routeId = String(object.routeId);
          if (object.routeType != null)
            message.routeType = object.routeType | 0;
          if (object.trip != null) {
            if (typeof object.trip !== "object")
              throw TypeError(".transit_realtime.EntitySelector.trip: object expected");
            message.trip = $root.transit_realtime.TripDescriptor.fromObject(object.trip, _depth + 1);
          }
          if (object.stopId != null)
            message.stopId = String(object.stopId);
          if (object.directionId != null)
            message.directionId = object.directionId >>> 0;
          return message;
        };
        EntitySelector.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.agencyId = "";
            object.routeId = "";
            object.routeType = 0;
            object.trip = null;
            object.stopId = "";
            object.directionId = 0;
          }
          if (message.agencyId != null && message.hasOwnProperty("agencyId"))
            object.agencyId = message.agencyId;
          if (message.routeId != null && message.hasOwnProperty("routeId"))
            object.routeId = message.routeId;
          if (message.routeType != null && message.hasOwnProperty("routeType"))
            object.routeType = message.routeType;
          if (message.trip != null && message.hasOwnProperty("trip"))
            object.trip = $root.transit_realtime.TripDescriptor.toObject(message.trip, options);
          if (message.stopId != null && message.hasOwnProperty("stopId"))
            object.stopId = message.stopId;
          if (message.directionId != null && message.hasOwnProperty("directionId"))
            object.directionId = message.directionId;
          return object;
        };
        EntitySelector.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        EntitySelector.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.EntitySelector";
        };
        return EntitySelector;
      })();
      transit_realtime2.TranslatedString = (function() {
        function TranslatedString(properties) {
          this.translation = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TranslatedString.prototype.translation = $util.emptyArray;
        TranslatedString.create = function create(properties) {
          return new TranslatedString(properties);
        };
        TranslatedString.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.translation != null && message.translation.length)
            for (var i = 0; i < message.translation.length; ++i)
              $root.transit_realtime.TranslatedString.Translation.encode(message.translation[i], writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TranslatedString.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TranslatedString.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TranslatedString();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if (!(message.translation && message.translation.length))
                  message.translation = [];
                message.translation.push($root.transit_realtime.TranslatedString.Translation.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        TranslatedString.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TranslatedString.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.translation != null && message.hasOwnProperty("translation")) {
            if (!Array.isArray(message.translation))
              return "translation: array expected";
            for (var i = 0; i < message.translation.length; ++i) {
              var error = $root.transit_realtime.TranslatedString.Translation.verify(message.translation[i], _depth + 1);
              if (error)
                return "translation." + error;
            }
          }
          return null;
        };
        TranslatedString.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TranslatedString)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TranslatedString();
          if (object.translation) {
            if (!Array.isArray(object.translation))
              throw TypeError(".transit_realtime.TranslatedString.translation: array expected");
            message.translation = Array(object.translation.length);
            for (var i = 0; i < object.translation.length; ++i) {
              if (typeof object.translation[i] !== "object")
                throw TypeError(".transit_realtime.TranslatedString.translation: object expected");
              message.translation[i] = $root.transit_realtime.TranslatedString.Translation.fromObject(object.translation[i], _depth + 1);
            }
          }
          return message;
        };
        TranslatedString.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults)
            object.translation = [];
          if (message.translation && message.translation.length) {
            object.translation = Array(message.translation.length);
            for (var j = 0; j < message.translation.length; ++j)
              object.translation[j] = $root.transit_realtime.TranslatedString.Translation.toObject(message.translation[j], options);
          }
          return object;
        };
        TranslatedString.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TranslatedString.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TranslatedString";
        };
        TranslatedString.Translation = (function() {
          function Translation(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          Translation.prototype.text = "";
          Translation.prototype.language = "";
          Translation.create = function create(properties) {
            return new Translation(properties);
          };
          Translation.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.text);
            if (message.language != null && Object.hasOwnProperty.call(message, "language"))
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.language);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          Translation.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          Translation.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TranslatedString.Translation();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.text = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.language = reader.string();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            if (!message.hasOwnProperty("text"))
              throw $util.ProtocolError("missing required 'text'", { instance: message });
            return message;
          };
          Translation.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          Translation.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (!$util.isString(message.text))
              return "text: string expected";
            if (message.language != null && message.hasOwnProperty("language")) {
              if (!$util.isString(message.language))
                return "language: string expected";
            }
            return null;
          };
          Translation.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TranslatedString.Translation)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TranslatedString.Translation();
            if (object.text != null)
              message.text = String(object.text);
            if (object.language != null)
              message.language = String(object.language);
            return message;
          };
          Translation.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.text = "";
              object.language = "";
            }
            if (message.text != null && message.hasOwnProperty("text"))
              object.text = message.text;
            if (message.language != null && message.hasOwnProperty("language"))
              object.language = message.language;
            return object;
          };
          Translation.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          Translation.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TranslatedString.Translation";
          };
          return Translation;
        })();
        return TranslatedString;
      })();
      transit_realtime2.TranslatedImage = (function() {
        function TranslatedImage(properties) {
          this.localizedImage = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TranslatedImage.prototype.localizedImage = $util.emptyArray;
        TranslatedImage.create = function create(properties) {
          return new TranslatedImage(properties);
        };
        TranslatedImage.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.localizedImage != null && message.localizedImage.length)
            for (var i = 0; i < message.localizedImage.length; ++i)
              $root.transit_realtime.TranslatedImage.LocalizedImage.encode(message.localizedImage[i], writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TranslatedImage.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TranslatedImage.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TranslatedImage();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if (!(message.localizedImage && message.localizedImage.length))
                  message.localizedImage = [];
                message.localizedImage.push($root.transit_realtime.TranslatedImage.LocalizedImage.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        TranslatedImage.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TranslatedImage.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.localizedImage != null && message.hasOwnProperty("localizedImage")) {
            if (!Array.isArray(message.localizedImage))
              return "localizedImage: array expected";
            for (var i = 0; i < message.localizedImage.length; ++i) {
              var error = $root.transit_realtime.TranslatedImage.LocalizedImage.verify(message.localizedImage[i], _depth + 1);
              if (error)
                return "localizedImage." + error;
            }
          }
          return null;
        };
        TranslatedImage.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TranslatedImage)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TranslatedImage();
          if (object.localizedImage) {
            if (!Array.isArray(object.localizedImage))
              throw TypeError(".transit_realtime.TranslatedImage.localizedImage: array expected");
            message.localizedImage = Array(object.localizedImage.length);
            for (var i = 0; i < object.localizedImage.length; ++i) {
              if (typeof object.localizedImage[i] !== "object")
                throw TypeError(".transit_realtime.TranslatedImage.localizedImage: object expected");
              message.localizedImage[i] = $root.transit_realtime.TranslatedImage.LocalizedImage.fromObject(object.localizedImage[i], _depth + 1);
            }
          }
          return message;
        };
        TranslatedImage.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults)
            object.localizedImage = [];
          if (message.localizedImage && message.localizedImage.length) {
            object.localizedImage = Array(message.localizedImage.length);
            for (var j = 0; j < message.localizedImage.length; ++j)
              object.localizedImage[j] = $root.transit_realtime.TranslatedImage.LocalizedImage.toObject(message.localizedImage[j], options);
          }
          return object;
        };
        TranslatedImage.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TranslatedImage.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TranslatedImage";
        };
        TranslatedImage.LocalizedImage = (function() {
          function LocalizedImage(properties) {
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          LocalizedImage.prototype.url = "";
          LocalizedImage.prototype.mediaType = "";
          LocalizedImage.prototype.language = "";
          LocalizedImage.create = function create(properties) {
            return new LocalizedImage(properties);
          };
          LocalizedImage.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.url);
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.mediaType);
            if (message.language != null && Object.hasOwnProperty.call(message, "language"))
              writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).string(message.language);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          LocalizedImage.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          LocalizedImage.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TranslatedImage.LocalizedImage();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.url = reader.string();
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.mediaType = reader.string();
                  continue;
                }
                case 3: {
                  if (wireType !== 2)
                    break;
                  message.language = reader.string();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            if (!message.hasOwnProperty("url"))
              throw $util.ProtocolError("missing required 'url'", { instance: message });
            if (!message.hasOwnProperty("mediaType"))
              throw $util.ProtocolError("missing required 'mediaType'", { instance: message });
            return message;
          };
          LocalizedImage.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          LocalizedImage.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (!$util.isString(message.url))
              return "url: string expected";
            if (!$util.isString(message.mediaType))
              return "mediaType: string expected";
            if (message.language != null && message.hasOwnProperty("language")) {
              if (!$util.isString(message.language))
                return "language: string expected";
            }
            return null;
          };
          LocalizedImage.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TranslatedImage.LocalizedImage)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TranslatedImage.LocalizedImage();
            if (object.url != null)
              message.url = String(object.url);
            if (object.mediaType != null)
              message.mediaType = String(object.mediaType);
            if (object.language != null)
              message.language = String(object.language);
            return message;
          };
          LocalizedImage.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.defaults) {
              object.url = "";
              object.mediaType = "";
              object.language = "";
            }
            if (message.url != null && message.hasOwnProperty("url"))
              object.url = message.url;
            if (message.mediaType != null && message.hasOwnProperty("mediaType"))
              object.mediaType = message.mediaType;
            if (message.language != null && message.hasOwnProperty("language"))
              object.language = message.language;
            return object;
          };
          LocalizedImage.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          LocalizedImage.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TranslatedImage.LocalizedImage";
          };
          return LocalizedImage;
        })();
        return TranslatedImage;
      })();
      transit_realtime2.Shape = (function() {
        function Shape(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        Shape.prototype.shapeId = "";
        Shape.prototype.encodedPolyline = "";
        Shape.create = function create(properties) {
          return new Shape(properties);
        };
        Shape.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.shapeId != null && Object.hasOwnProperty.call(message, "shapeId"))
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.shapeId);
          if (message.encodedPolyline != null && Object.hasOwnProperty.call(message, "encodedPolyline"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.encodedPolyline);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        Shape.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        Shape.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.Shape();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.shapeId = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.encodedPolyline = reader.string();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        Shape.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        Shape.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.shapeId != null && message.hasOwnProperty("shapeId")) {
            if (!$util.isString(message.shapeId))
              return "shapeId: string expected";
          }
          if (message.encodedPolyline != null && message.hasOwnProperty("encodedPolyline")) {
            if (!$util.isString(message.encodedPolyline))
              return "encodedPolyline: string expected";
          }
          return null;
        };
        Shape.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.Shape)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.Shape();
          if (object.shapeId != null)
            message.shapeId = String(object.shapeId);
          if (object.encodedPolyline != null)
            message.encodedPolyline = String(object.encodedPolyline);
          return message;
        };
        Shape.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.shapeId = "";
            object.encodedPolyline = "";
          }
          if (message.shapeId != null && message.hasOwnProperty("shapeId"))
            object.shapeId = message.shapeId;
          if (message.encodedPolyline != null && message.hasOwnProperty("encodedPolyline"))
            object.encodedPolyline = message.encodedPolyline;
          return object;
        };
        Shape.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        Shape.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.Shape";
        };
        return Shape;
      })();
      transit_realtime2.Stop = (function() {
        function Stop(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        Stop.prototype.stopId = "";
        Stop.prototype.stopCode = null;
        Stop.prototype.stopName = null;
        Stop.prototype.ttsStopName = null;
        Stop.prototype.stopDesc = null;
        Stop.prototype.stopLat = 0;
        Stop.prototype.stopLon = 0;
        Stop.prototype.zoneId = "";
        Stop.prototype.stopUrl = null;
        Stop.prototype.parentStation = "";
        Stop.prototype.stopTimezone = "";
        Stop.prototype.wheelchairBoarding = 0;
        Stop.prototype.levelId = "";
        Stop.prototype.platformCode = null;
        Stop.create = function create(properties) {
          return new Stop(properties);
        };
        Stop.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
            writer.uint32(
              /* id 1, wireType 2 =*/
              10
            ).string(message.stopId);
          if (message.stopCode != null && Object.hasOwnProperty.call(message, "stopCode"))
            $root.transit_realtime.TranslatedString.encode(message.stopCode, writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).fork()).ldelim();
          if (message.stopName != null && Object.hasOwnProperty.call(message, "stopName"))
            $root.transit_realtime.TranslatedString.encode(message.stopName, writer.uint32(
              /* id 3, wireType 2 =*/
              26
            ).fork()).ldelim();
          if (message.ttsStopName != null && Object.hasOwnProperty.call(message, "ttsStopName"))
            $root.transit_realtime.TranslatedString.encode(message.ttsStopName, writer.uint32(
              /* id 4, wireType 2 =*/
              34
            ).fork()).ldelim();
          if (message.stopDesc != null && Object.hasOwnProperty.call(message, "stopDesc"))
            $root.transit_realtime.TranslatedString.encode(message.stopDesc, writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).fork()).ldelim();
          if (message.stopLat != null && Object.hasOwnProperty.call(message, "stopLat"))
            writer.uint32(
              /* id 6, wireType 5 =*/
              53
            ).float(message.stopLat);
          if (message.stopLon != null && Object.hasOwnProperty.call(message, "stopLon"))
            writer.uint32(
              /* id 7, wireType 5 =*/
              61
            ).float(message.stopLon);
          if (message.zoneId != null && Object.hasOwnProperty.call(message, "zoneId"))
            writer.uint32(
              /* id 8, wireType 2 =*/
              66
            ).string(message.zoneId);
          if (message.stopUrl != null && Object.hasOwnProperty.call(message, "stopUrl"))
            $root.transit_realtime.TranslatedString.encode(message.stopUrl, writer.uint32(
              /* id 9, wireType 2 =*/
              74
            ).fork()).ldelim();
          if (message.parentStation != null && Object.hasOwnProperty.call(message, "parentStation"))
            writer.uint32(
              /* id 11, wireType 2 =*/
              90
            ).string(message.parentStation);
          if (message.stopTimezone != null && Object.hasOwnProperty.call(message, "stopTimezone"))
            writer.uint32(
              /* id 12, wireType 2 =*/
              98
            ).string(message.stopTimezone);
          if (message.wheelchairBoarding != null && Object.hasOwnProperty.call(message, "wheelchairBoarding"))
            writer.uint32(
              /* id 13, wireType 0 =*/
              104
            ).int32(message.wheelchairBoarding);
          if (message.levelId != null && Object.hasOwnProperty.call(message, "levelId"))
            writer.uint32(
              /* id 14, wireType 2 =*/
              114
            ).string(message.levelId);
          if (message.platformCode != null && Object.hasOwnProperty.call(message, "platformCode"))
            $root.transit_realtime.TranslatedString.encode(message.platformCode, writer.uint32(
              /* id 15, wireType 2 =*/
              122
            ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        Stop.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        Stop.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.Stop();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                message.stopId = reader.string();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.stopCode = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.stopCode);
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                message.stopName = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.stopName);
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                message.ttsStopName = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.ttsStopName);
                continue;
              }
              case 5: {
                if (wireType !== 2)
                  break;
                message.stopDesc = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.stopDesc);
                continue;
              }
              case 6: {
                if (wireType !== 5)
                  break;
                message.stopLat = reader.float();
                continue;
              }
              case 7: {
                if (wireType !== 5)
                  break;
                message.stopLon = reader.float();
                continue;
              }
              case 8: {
                if (wireType !== 2)
                  break;
                message.zoneId = reader.string();
                continue;
              }
              case 9: {
                if (wireType !== 2)
                  break;
                message.stopUrl = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.stopUrl);
                continue;
              }
              case 11: {
                if (wireType !== 2)
                  break;
                message.parentStation = reader.string();
                continue;
              }
              case 12: {
                if (wireType !== 2)
                  break;
                message.stopTimezone = reader.string();
                continue;
              }
              case 13: {
                if (wireType !== 0)
                  break;
                message.wheelchairBoarding = reader.int32();
                continue;
              }
              case 14: {
                if (wireType !== 2)
                  break;
                message.levelId = reader.string();
                continue;
              }
              case 15: {
                if (wireType !== 2)
                  break;
                message.platformCode = $root.transit_realtime.TranslatedString.decode(reader, reader.uint32(), void 0, _depth + 1, message.platformCode);
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        Stop.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        Stop.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.stopId != null && message.hasOwnProperty("stopId")) {
            if (!$util.isString(message.stopId))
              return "stopId: string expected";
          }
          if (message.stopCode != null && message.hasOwnProperty("stopCode")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.stopCode, _depth + 1);
            if (error)
              return "stopCode." + error;
          }
          if (message.stopName != null && message.hasOwnProperty("stopName")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.stopName, _depth + 1);
            if (error)
              return "stopName." + error;
          }
          if (message.ttsStopName != null && message.hasOwnProperty("ttsStopName")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.ttsStopName, _depth + 1);
            if (error)
              return "ttsStopName." + error;
          }
          if (message.stopDesc != null && message.hasOwnProperty("stopDesc")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.stopDesc, _depth + 1);
            if (error)
              return "stopDesc." + error;
          }
          if (message.stopLat != null && message.hasOwnProperty("stopLat")) {
            if (typeof message.stopLat !== "number")
              return "stopLat: number expected";
          }
          if (message.stopLon != null && message.hasOwnProperty("stopLon")) {
            if (typeof message.stopLon !== "number")
              return "stopLon: number expected";
          }
          if (message.zoneId != null && message.hasOwnProperty("zoneId")) {
            if (!$util.isString(message.zoneId))
              return "zoneId: string expected";
          }
          if (message.stopUrl != null && message.hasOwnProperty("stopUrl")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.stopUrl, _depth + 1);
            if (error)
              return "stopUrl." + error;
          }
          if (message.parentStation != null && message.hasOwnProperty("parentStation")) {
            if (!$util.isString(message.parentStation))
              return "parentStation: string expected";
          }
          if (message.stopTimezone != null && message.hasOwnProperty("stopTimezone")) {
            if (!$util.isString(message.stopTimezone))
              return "stopTimezone: string expected";
          }
          if (message.wheelchairBoarding != null && message.hasOwnProperty("wheelchairBoarding"))
            switch (message.wheelchairBoarding) {
              default:
                return "wheelchairBoarding: enum value expected";
              case 0:
              case 1:
              case 2:
                break;
            }
          if (message.levelId != null && message.hasOwnProperty("levelId")) {
            if (!$util.isString(message.levelId))
              return "levelId: string expected";
          }
          if (message.platformCode != null && message.hasOwnProperty("platformCode")) {
            var error = $root.transit_realtime.TranslatedString.verify(message.platformCode, _depth + 1);
            if (error)
              return "platformCode." + error;
          }
          return null;
        };
        Stop.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.Stop)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.Stop();
          if (object.stopId != null)
            message.stopId = String(object.stopId);
          if (object.stopCode != null) {
            if (typeof object.stopCode !== "object")
              throw TypeError(".transit_realtime.Stop.stopCode: object expected");
            message.stopCode = $root.transit_realtime.TranslatedString.fromObject(object.stopCode, _depth + 1);
          }
          if (object.stopName != null) {
            if (typeof object.stopName !== "object")
              throw TypeError(".transit_realtime.Stop.stopName: object expected");
            message.stopName = $root.transit_realtime.TranslatedString.fromObject(object.stopName, _depth + 1);
          }
          if (object.ttsStopName != null) {
            if (typeof object.ttsStopName !== "object")
              throw TypeError(".transit_realtime.Stop.ttsStopName: object expected");
            message.ttsStopName = $root.transit_realtime.TranslatedString.fromObject(object.ttsStopName, _depth + 1);
          }
          if (object.stopDesc != null) {
            if (typeof object.stopDesc !== "object")
              throw TypeError(".transit_realtime.Stop.stopDesc: object expected");
            message.stopDesc = $root.transit_realtime.TranslatedString.fromObject(object.stopDesc, _depth + 1);
          }
          if (object.stopLat != null)
            message.stopLat = Number(object.stopLat);
          if (object.stopLon != null)
            message.stopLon = Number(object.stopLon);
          if (object.zoneId != null)
            message.zoneId = String(object.zoneId);
          if (object.stopUrl != null) {
            if (typeof object.stopUrl !== "object")
              throw TypeError(".transit_realtime.Stop.stopUrl: object expected");
            message.stopUrl = $root.transit_realtime.TranslatedString.fromObject(object.stopUrl, _depth + 1);
          }
          if (object.parentStation != null)
            message.parentStation = String(object.parentStation);
          if (object.stopTimezone != null)
            message.stopTimezone = String(object.stopTimezone);
          switch (object.wheelchairBoarding) {
            default:
              if (typeof object.wheelchairBoarding === "number") {
                message.wheelchairBoarding = object.wheelchairBoarding;
                break;
              }
              break;
            case "UNKNOWN":
            case 0:
              message.wheelchairBoarding = 0;
              break;
            case "AVAILABLE":
            case 1:
              message.wheelchairBoarding = 1;
              break;
            case "NOT_AVAILABLE":
            case 2:
              message.wheelchairBoarding = 2;
              break;
          }
          if (object.levelId != null)
            message.levelId = String(object.levelId);
          if (object.platformCode != null) {
            if (typeof object.platformCode !== "object")
              throw TypeError(".transit_realtime.Stop.platformCode: object expected");
            message.platformCode = $root.transit_realtime.TranslatedString.fromObject(object.platformCode, _depth + 1);
          }
          return message;
        };
        Stop.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.stopId = "";
            object.stopCode = null;
            object.stopName = null;
            object.ttsStopName = null;
            object.stopDesc = null;
            object.stopLat = 0;
            object.stopLon = 0;
            object.zoneId = "";
            object.stopUrl = null;
            object.parentStation = "";
            object.stopTimezone = "";
            object.wheelchairBoarding = options.enums === String ? "UNKNOWN" : 0;
            object.levelId = "";
            object.platformCode = null;
          }
          if (message.stopId != null && message.hasOwnProperty("stopId"))
            object.stopId = message.stopId;
          if (message.stopCode != null && message.hasOwnProperty("stopCode"))
            object.stopCode = $root.transit_realtime.TranslatedString.toObject(message.stopCode, options);
          if (message.stopName != null && message.hasOwnProperty("stopName"))
            object.stopName = $root.transit_realtime.TranslatedString.toObject(message.stopName, options);
          if (message.ttsStopName != null && message.hasOwnProperty("ttsStopName"))
            object.ttsStopName = $root.transit_realtime.TranslatedString.toObject(message.ttsStopName, options);
          if (message.stopDesc != null && message.hasOwnProperty("stopDesc"))
            object.stopDesc = $root.transit_realtime.TranslatedString.toObject(message.stopDesc, options);
          if (message.stopLat != null && message.hasOwnProperty("stopLat"))
            object.stopLat = options.json && !isFinite(message.stopLat) ? String(message.stopLat) : message.stopLat;
          if (message.stopLon != null && message.hasOwnProperty("stopLon"))
            object.stopLon = options.json && !isFinite(message.stopLon) ? String(message.stopLon) : message.stopLon;
          if (message.zoneId != null && message.hasOwnProperty("zoneId"))
            object.zoneId = message.zoneId;
          if (message.stopUrl != null && message.hasOwnProperty("stopUrl"))
            object.stopUrl = $root.transit_realtime.TranslatedString.toObject(message.stopUrl, options);
          if (message.parentStation != null && message.hasOwnProperty("parentStation"))
            object.parentStation = message.parentStation;
          if (message.stopTimezone != null && message.hasOwnProperty("stopTimezone"))
            object.stopTimezone = message.stopTimezone;
          if (message.wheelchairBoarding != null && message.hasOwnProperty("wheelchairBoarding"))
            object.wheelchairBoarding = options.enums === String ? $root.transit_realtime.Stop.WheelchairBoarding[message.wheelchairBoarding] === void 0 ? message.wheelchairBoarding : $root.transit_realtime.Stop.WheelchairBoarding[message.wheelchairBoarding] : message.wheelchairBoarding;
          if (message.levelId != null && message.hasOwnProperty("levelId"))
            object.levelId = message.levelId;
          if (message.platformCode != null && message.hasOwnProperty("platformCode"))
            object.platformCode = $root.transit_realtime.TranslatedString.toObject(message.platformCode, options);
          return object;
        };
        Stop.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        Stop.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.Stop";
        };
        Stop.WheelchairBoarding = (function() {
          var valuesById = {}, values = Object.create(valuesById);
          values[valuesById[0] = "UNKNOWN"] = 0;
          values[valuesById[1] = "AVAILABLE"] = 1;
          values[valuesById[2] = "NOT_AVAILABLE"] = 2;
          return values;
        })();
        return Stop;
      })();
      transit_realtime2.TripModifications = (function() {
        function TripModifications(properties) {
          this.selectedTrips = [];
          this.startTimes = [];
          this.serviceDates = [];
          this.modifications = [];
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        TripModifications.prototype.selectedTrips = $util.emptyArray;
        TripModifications.prototype.startTimes = $util.emptyArray;
        TripModifications.prototype.serviceDates = $util.emptyArray;
        TripModifications.prototype.modifications = $util.emptyArray;
        TripModifications.create = function create(properties) {
          return new TripModifications(properties);
        };
        TripModifications.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.selectedTrips != null && message.selectedTrips.length)
            for (var i = 0; i < message.selectedTrips.length; ++i)
              $root.transit_realtime.TripModifications.SelectedTrips.encode(message.selectedTrips[i], writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).fork()).ldelim();
          if (message.startTimes != null && message.startTimes.length)
            for (var i = 0; i < message.startTimes.length; ++i)
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.startTimes[i]);
          if (message.serviceDates != null && message.serviceDates.length)
            for (var i = 0; i < message.serviceDates.length; ++i)
              writer.uint32(
                /* id 3, wireType 2 =*/
                26
              ).string(message.serviceDates[i]);
          if (message.modifications != null && message.modifications.length)
            for (var i = 0; i < message.modifications.length; ++i)
              $root.transit_realtime.TripModifications.Modification.encode(message.modifications[i], writer.uint32(
                /* id 4, wireType 2 =*/
                34
              ).fork()).ldelim();
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        TripModifications.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        TripModifications.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripModifications();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 2)
                  break;
                if (!(message.selectedTrips && message.selectedTrips.length))
                  message.selectedTrips = [];
                message.selectedTrips.push($root.transit_realtime.TripModifications.SelectedTrips.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                if (!(message.startTimes && message.startTimes.length))
                  message.startTimes = [];
                message.startTimes.push(reader.string());
                continue;
              }
              case 3: {
                if (wireType !== 2)
                  break;
                if (!(message.serviceDates && message.serviceDates.length))
                  message.serviceDates = [];
                message.serviceDates.push(reader.string());
                continue;
              }
              case 4: {
                if (wireType !== 2)
                  break;
                if (!(message.modifications && message.modifications.length))
                  message.modifications = [];
                message.modifications.push($root.transit_realtime.TripModifications.Modification.decode(reader, reader.uint32(), void 0, _depth + 1));
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        TripModifications.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        TripModifications.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.selectedTrips != null && message.hasOwnProperty("selectedTrips")) {
            if (!Array.isArray(message.selectedTrips))
              return "selectedTrips: array expected";
            for (var i = 0; i < message.selectedTrips.length; ++i) {
              var error = $root.transit_realtime.TripModifications.SelectedTrips.verify(message.selectedTrips[i], _depth + 1);
              if (error)
                return "selectedTrips." + error;
            }
          }
          if (message.startTimes != null && message.hasOwnProperty("startTimes")) {
            if (!Array.isArray(message.startTimes))
              return "startTimes: array expected";
            for (var i = 0; i < message.startTimes.length; ++i)
              if (!$util.isString(message.startTimes[i]))
                return "startTimes: string[] expected";
          }
          if (message.serviceDates != null && message.hasOwnProperty("serviceDates")) {
            if (!Array.isArray(message.serviceDates))
              return "serviceDates: array expected";
            for (var i = 0; i < message.serviceDates.length; ++i)
              if (!$util.isString(message.serviceDates[i]))
                return "serviceDates: string[] expected";
          }
          if (message.modifications != null && message.hasOwnProperty("modifications")) {
            if (!Array.isArray(message.modifications))
              return "modifications: array expected";
            for (var i = 0; i < message.modifications.length; ++i) {
              var error = $root.transit_realtime.TripModifications.Modification.verify(message.modifications[i], _depth + 1);
              if (error)
                return "modifications." + error;
            }
          }
          return null;
        };
        TripModifications.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.TripModifications)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.TripModifications();
          if (object.selectedTrips) {
            if (!Array.isArray(object.selectedTrips))
              throw TypeError(".transit_realtime.TripModifications.selectedTrips: array expected");
            message.selectedTrips = Array(object.selectedTrips.length);
            for (var i = 0; i < object.selectedTrips.length; ++i) {
              if (typeof object.selectedTrips[i] !== "object")
                throw TypeError(".transit_realtime.TripModifications.selectedTrips: object expected");
              message.selectedTrips[i] = $root.transit_realtime.TripModifications.SelectedTrips.fromObject(object.selectedTrips[i], _depth + 1);
            }
          }
          if (object.startTimes) {
            if (!Array.isArray(object.startTimes))
              throw TypeError(".transit_realtime.TripModifications.startTimes: array expected");
            message.startTimes = Array(object.startTimes.length);
            for (var i = 0; i < object.startTimes.length; ++i)
              message.startTimes[i] = String(object.startTimes[i]);
          }
          if (object.serviceDates) {
            if (!Array.isArray(object.serviceDates))
              throw TypeError(".transit_realtime.TripModifications.serviceDates: array expected");
            message.serviceDates = Array(object.serviceDates.length);
            for (var i = 0; i < object.serviceDates.length; ++i)
              message.serviceDates[i] = String(object.serviceDates[i]);
          }
          if (object.modifications) {
            if (!Array.isArray(object.modifications))
              throw TypeError(".transit_realtime.TripModifications.modifications: array expected");
            message.modifications = Array(object.modifications.length);
            for (var i = 0; i < object.modifications.length; ++i) {
              if (typeof object.modifications[i] !== "object")
                throw TypeError(".transit_realtime.TripModifications.modifications: object expected");
              message.modifications[i] = $root.transit_realtime.TripModifications.Modification.fromObject(object.modifications[i], _depth + 1);
            }
          }
          return message;
        };
        TripModifications.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.arrays || options.defaults) {
            object.selectedTrips = [];
            object.startTimes = [];
            object.serviceDates = [];
            object.modifications = [];
          }
          if (message.selectedTrips && message.selectedTrips.length) {
            object.selectedTrips = Array(message.selectedTrips.length);
            for (var j = 0; j < message.selectedTrips.length; ++j)
              object.selectedTrips[j] = $root.transit_realtime.TripModifications.SelectedTrips.toObject(message.selectedTrips[j], options);
          }
          if (message.startTimes && message.startTimes.length) {
            object.startTimes = Array(message.startTimes.length);
            for (var j = 0; j < message.startTimes.length; ++j)
              object.startTimes[j] = message.startTimes[j];
          }
          if (message.serviceDates && message.serviceDates.length) {
            object.serviceDates = Array(message.serviceDates.length);
            for (var j = 0; j < message.serviceDates.length; ++j)
              object.serviceDates[j] = message.serviceDates[j];
          }
          if (message.modifications && message.modifications.length) {
            object.modifications = Array(message.modifications.length);
            for (var j = 0; j < message.modifications.length; ++j)
              object.modifications[j] = $root.transit_realtime.TripModifications.Modification.toObject(message.modifications[j], options);
          }
          return object;
        };
        TripModifications.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        TripModifications.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.TripModifications";
        };
        TripModifications.Modification = (function() {
          function Modification(properties) {
            this.replacementStops = [];
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          Modification.prototype.startStopSelector = null;
          Modification.prototype.endStopSelector = null;
          Modification.prototype.propagatedModificationDelay = 0;
          Modification.prototype.replacementStops = $util.emptyArray;
          Modification.prototype.serviceAlertId = "";
          Modification.prototype.lastModifiedTime = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
          Modification.create = function create(properties) {
            return new Modification(properties);
          };
          Modification.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.startStopSelector != null && Object.hasOwnProperty.call(message, "startStopSelector"))
              $root.transit_realtime.StopSelector.encode(message.startStopSelector, writer.uint32(
                /* id 1, wireType 2 =*/
                10
              ).fork()).ldelim();
            if (message.endStopSelector != null && Object.hasOwnProperty.call(message, "endStopSelector"))
              $root.transit_realtime.StopSelector.encode(message.endStopSelector, writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).fork()).ldelim();
            if (message.propagatedModificationDelay != null && Object.hasOwnProperty.call(message, "propagatedModificationDelay"))
              writer.uint32(
                /* id 3, wireType 0 =*/
                24
              ).int32(message.propagatedModificationDelay);
            if (message.replacementStops != null && message.replacementStops.length)
              for (var i = 0; i < message.replacementStops.length; ++i)
                $root.transit_realtime.ReplacementStop.encode(message.replacementStops[i], writer.uint32(
                  /* id 4, wireType 2 =*/
                  34
                ).fork()).ldelim();
            if (message.serviceAlertId != null && Object.hasOwnProperty.call(message, "serviceAlertId"))
              writer.uint32(
                /* id 5, wireType 2 =*/
                42
              ).string(message.serviceAlertId);
            if (message.lastModifiedTime != null && Object.hasOwnProperty.call(message, "lastModifiedTime"))
              writer.uint32(
                /* id 6, wireType 0 =*/
                48
              ).uint64(message.lastModifiedTime);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          Modification.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          Modification.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripModifications.Modification();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  message.startStopSelector = $root.transit_realtime.StopSelector.decode(reader, reader.uint32(), void 0, _depth + 1, message.startStopSelector);
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.endStopSelector = $root.transit_realtime.StopSelector.decode(reader, reader.uint32(), void 0, _depth + 1, message.endStopSelector);
                  continue;
                }
                case 3: {
                  if (wireType !== 0)
                    break;
                  message.propagatedModificationDelay = reader.int32();
                  continue;
                }
                case 4: {
                  if (wireType !== 2)
                    break;
                  if (!(message.replacementStops && message.replacementStops.length))
                    message.replacementStops = [];
                  message.replacementStops.push($root.transit_realtime.ReplacementStop.decode(reader, reader.uint32(), void 0, _depth + 1));
                  continue;
                }
                case 5: {
                  if (wireType !== 2)
                    break;
                  message.serviceAlertId = reader.string();
                  continue;
                }
                case 6: {
                  if (wireType !== 0)
                    break;
                  message.lastModifiedTime = reader.uint64();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          Modification.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          Modification.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.startStopSelector != null && message.hasOwnProperty("startStopSelector")) {
              var error = $root.transit_realtime.StopSelector.verify(message.startStopSelector, _depth + 1);
              if (error)
                return "startStopSelector." + error;
            }
            if (message.endStopSelector != null && message.hasOwnProperty("endStopSelector")) {
              var error = $root.transit_realtime.StopSelector.verify(message.endStopSelector, _depth + 1);
              if (error)
                return "endStopSelector." + error;
            }
            if (message.propagatedModificationDelay != null && message.hasOwnProperty("propagatedModificationDelay")) {
              if (!$util.isInteger(message.propagatedModificationDelay))
                return "propagatedModificationDelay: integer expected";
            }
            if (message.replacementStops != null && message.hasOwnProperty("replacementStops")) {
              if (!Array.isArray(message.replacementStops))
                return "replacementStops: array expected";
              for (var i = 0; i < message.replacementStops.length; ++i) {
                var error = $root.transit_realtime.ReplacementStop.verify(message.replacementStops[i], _depth + 1);
                if (error)
                  return "replacementStops." + error;
              }
            }
            if (message.serviceAlertId != null && message.hasOwnProperty("serviceAlertId")) {
              if (!$util.isString(message.serviceAlertId))
                return "serviceAlertId: string expected";
            }
            if (message.lastModifiedTime != null && message.hasOwnProperty("lastModifiedTime")) {
              if (!$util.isInteger(message.lastModifiedTime) && !(message.lastModifiedTime && $util.isInteger(message.lastModifiedTime.low) && $util.isInteger(message.lastModifiedTime.high)))
                return "lastModifiedTime: integer|Long expected";
            }
            return null;
          };
          Modification.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripModifications.Modification)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripModifications.Modification();
            if (object.startStopSelector != null) {
              if (typeof object.startStopSelector !== "object")
                throw TypeError(".transit_realtime.TripModifications.Modification.startStopSelector: object expected");
              message.startStopSelector = $root.transit_realtime.StopSelector.fromObject(object.startStopSelector, _depth + 1);
            }
            if (object.endStopSelector != null) {
              if (typeof object.endStopSelector !== "object")
                throw TypeError(".transit_realtime.TripModifications.Modification.endStopSelector: object expected");
              message.endStopSelector = $root.transit_realtime.StopSelector.fromObject(object.endStopSelector, _depth + 1);
            }
            if (object.propagatedModificationDelay != null)
              message.propagatedModificationDelay = object.propagatedModificationDelay | 0;
            if (object.replacementStops) {
              if (!Array.isArray(object.replacementStops))
                throw TypeError(".transit_realtime.TripModifications.Modification.replacementStops: array expected");
              message.replacementStops = Array(object.replacementStops.length);
              for (var i = 0; i < object.replacementStops.length; ++i) {
                if (typeof object.replacementStops[i] !== "object")
                  throw TypeError(".transit_realtime.TripModifications.Modification.replacementStops: object expected");
                message.replacementStops[i] = $root.transit_realtime.ReplacementStop.fromObject(object.replacementStops[i], _depth + 1);
              }
            }
            if (object.serviceAlertId != null)
              message.serviceAlertId = String(object.serviceAlertId);
            if (object.lastModifiedTime != null) {
              if ($util.Long)
                (message.lastModifiedTime = $util.Long.fromValue(object.lastModifiedTime)).unsigned = true;
              else if (typeof object.lastModifiedTime === "string")
                message.lastModifiedTime = parseInt(object.lastModifiedTime, 10);
              else if (typeof object.lastModifiedTime === "number")
                message.lastModifiedTime = object.lastModifiedTime;
              else if (typeof object.lastModifiedTime === "object")
                message.lastModifiedTime = new $util.LongBits(object.lastModifiedTime.low >>> 0, object.lastModifiedTime.high >>> 0).toNumber(true);
            }
            return message;
          };
          Modification.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.arrays || options.defaults)
              object.replacementStops = [];
            if (options.defaults) {
              object.startStopSelector = null;
              object.endStopSelector = null;
              object.propagatedModificationDelay = 0;
              object.serviceAlertId = "";
              if ($util.Long) {
                var long = new $util.Long(0, 0, true);
                object.lastModifiedTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
              } else
                object.lastModifiedTime = options.longs === String ? "0" : 0;
            }
            if (message.startStopSelector != null && message.hasOwnProperty("startStopSelector"))
              object.startStopSelector = $root.transit_realtime.StopSelector.toObject(message.startStopSelector, options);
            if (message.endStopSelector != null && message.hasOwnProperty("endStopSelector"))
              object.endStopSelector = $root.transit_realtime.StopSelector.toObject(message.endStopSelector, options);
            if (message.propagatedModificationDelay != null && message.hasOwnProperty("propagatedModificationDelay"))
              object.propagatedModificationDelay = message.propagatedModificationDelay;
            if (message.replacementStops && message.replacementStops.length) {
              object.replacementStops = Array(message.replacementStops.length);
              for (var j = 0; j < message.replacementStops.length; ++j)
                object.replacementStops[j] = $root.transit_realtime.ReplacementStop.toObject(message.replacementStops[j], options);
            }
            if (message.serviceAlertId != null && message.hasOwnProperty("serviceAlertId"))
              object.serviceAlertId = message.serviceAlertId;
            if (message.lastModifiedTime != null && message.hasOwnProperty("lastModifiedTime"))
              if (typeof message.lastModifiedTime === "number")
                object.lastModifiedTime = options.longs === String ? String(message.lastModifiedTime) : message.lastModifiedTime;
              else
                object.lastModifiedTime = options.longs === String ? $util.Long.prototype.toString.call(message.lastModifiedTime) : options.longs === Number ? new $util.LongBits(message.lastModifiedTime.low >>> 0, message.lastModifiedTime.high >>> 0).toNumber(true) : message.lastModifiedTime;
            return object;
          };
          Modification.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          Modification.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripModifications.Modification";
          };
          return Modification;
        })();
        TripModifications.SelectedTrips = (function() {
          function SelectedTrips(properties) {
            this.tripIds = [];
            if (properties) {
              for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                  this[keys[i]] = properties[keys[i]];
            }
          }
          SelectedTrips.prototype.tripIds = $util.emptyArray;
          SelectedTrips.prototype.shapeId = "";
          SelectedTrips.create = function create(properties) {
            return new SelectedTrips(properties);
          };
          SelectedTrips.encode = function encode(message, writer) {
            if (!writer)
              writer = $Writer.create();
            if (message.tripIds != null && message.tripIds.length)
              for (var i = 0; i < message.tripIds.length; ++i)
                writer.uint32(
                  /* id 1, wireType 2 =*/
                  10
                ).string(message.tripIds[i]);
            if (message.shapeId != null && Object.hasOwnProperty.call(message, "shapeId"))
              writer.uint32(
                /* id 2, wireType 2 =*/
                18
              ).string(message.shapeId);
            if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
              for (var i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
            return writer;
          };
          SelectedTrips.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
          };
          SelectedTrips.decode = function decode(reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
              reader = $Reader.create(reader);
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $Reader.recursionLimit)
              throw Error("max depth exceeded");
            var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.TripModifications.SelectedTrips();
            while (reader.pos < end) {
              var start = reader.pos;
              var tag = reader.tag();
              if (tag === _end) {
                _end = void 0;
                break;
              }
              var wireType = tag & 7;
              switch (tag >>>= 3) {
                case 1: {
                  if (wireType !== 2)
                    break;
                  if (!(message.tripIds && message.tripIds.length))
                    message.tripIds = [];
                  message.tripIds.push(reader.string());
                  continue;
                }
                case 2: {
                  if (wireType !== 2)
                    break;
                  message.shapeId = reader.string();
                  continue;
                }
              }
              reader.skipType(wireType, _depth, tag);
              $util.makeProp(message, "$unknowns", false);
              (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
            if (_end !== void 0)
              throw Error("missing end group");
            return message;
          };
          SelectedTrips.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
              reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
          };
          SelectedTrips.verify = function verify(message, _depth) {
            if (typeof message !== "object" || message === null)
              return "object expected";
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              return "max depth exceeded";
            if (message.tripIds != null && message.hasOwnProperty("tripIds")) {
              if (!Array.isArray(message.tripIds))
                return "tripIds: array expected";
              for (var i = 0; i < message.tripIds.length; ++i)
                if (!$util.isString(message.tripIds[i]))
                  return "tripIds: string[] expected";
            }
            if (message.shapeId != null && message.hasOwnProperty("shapeId")) {
              if (!$util.isString(message.shapeId))
                return "shapeId: string expected";
            }
            return null;
          };
          SelectedTrips.fromObject = function fromObject(object, _depth) {
            if (object instanceof $root.transit_realtime.TripModifications.SelectedTrips)
              return object;
            if (_depth === void 0)
              _depth = 0;
            if (_depth > $util.recursionLimit)
              throw Error("max depth exceeded");
            var message = new $root.transit_realtime.TripModifications.SelectedTrips();
            if (object.tripIds) {
              if (!Array.isArray(object.tripIds))
                throw TypeError(".transit_realtime.TripModifications.SelectedTrips.tripIds: array expected");
              message.tripIds = Array(object.tripIds.length);
              for (var i = 0; i < object.tripIds.length; ++i)
                message.tripIds[i] = String(object.tripIds[i]);
            }
            if (object.shapeId != null)
              message.shapeId = String(object.shapeId);
            return message;
          };
          SelectedTrips.toObject = function toObject(message, options) {
            if (!options)
              options = {};
            var object = {};
            if (options.arrays || options.defaults)
              object.tripIds = [];
            if (options.defaults)
              object.shapeId = "";
            if (message.tripIds && message.tripIds.length) {
              object.tripIds = Array(message.tripIds.length);
              for (var j = 0; j < message.tripIds.length; ++j)
                object.tripIds[j] = message.tripIds[j];
            }
            if (message.shapeId != null && message.hasOwnProperty("shapeId"))
              object.shapeId = message.shapeId;
            return object;
          };
          SelectedTrips.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
          };
          SelectedTrips.getTypeUrl = function getTypeUrl(prefix) {
            if (prefix === void 0)
              prefix = "type.googleapis.com";
            return prefix + "/transit_realtime.TripModifications.SelectedTrips";
          };
          return SelectedTrips;
        })();
        return TripModifications;
      })();
      transit_realtime2.StopSelector = (function() {
        function StopSelector(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        StopSelector.prototype.stopSequence = 0;
        StopSelector.prototype.stopId = "";
        StopSelector.create = function create(properties) {
          return new StopSelector(properties);
        };
        StopSelector.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.stopSequence != null && Object.hasOwnProperty.call(message, "stopSequence"))
            writer.uint32(
              /* id 1, wireType 0 =*/
              8
            ).uint32(message.stopSequence);
          if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.stopId);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        StopSelector.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        StopSelector.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.StopSelector();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 0)
                  break;
                message.stopSequence = reader.uint32();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.stopId = reader.string();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        StopSelector.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        StopSelector.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.stopSequence != null && message.hasOwnProperty("stopSequence")) {
            if (!$util.isInteger(message.stopSequence))
              return "stopSequence: integer expected";
          }
          if (message.stopId != null && message.hasOwnProperty("stopId")) {
            if (!$util.isString(message.stopId))
              return "stopId: string expected";
          }
          return null;
        };
        StopSelector.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.StopSelector)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.StopSelector();
          if (object.stopSequence != null)
            message.stopSequence = object.stopSequence >>> 0;
          if (object.stopId != null)
            message.stopId = String(object.stopId);
          return message;
        };
        StopSelector.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.stopSequence = 0;
            object.stopId = "";
          }
          if (message.stopSequence != null && message.hasOwnProperty("stopSequence"))
            object.stopSequence = message.stopSequence;
          if (message.stopId != null && message.hasOwnProperty("stopId"))
            object.stopId = message.stopId;
          return object;
        };
        StopSelector.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        StopSelector.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.StopSelector";
        };
        return StopSelector;
      })();
      transit_realtime2.ReplacementStop = (function() {
        function ReplacementStop(properties) {
          if (properties) {
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
              if (properties[keys[i]] != null && keys[i] !== "__proto__")
                this[keys[i]] = properties[keys[i]];
          }
        }
        ReplacementStop.prototype.travelTimeToStop = 0;
        ReplacementStop.prototype.stopId = "";
        ReplacementStop.create = function create(properties) {
          return new ReplacementStop(properties);
        };
        ReplacementStop.encode = function encode(message, writer) {
          if (!writer)
            writer = $Writer.create();
          if (message.travelTimeToStop != null && Object.hasOwnProperty.call(message, "travelTimeToStop"))
            writer.uint32(
              /* id 1, wireType 0 =*/
              8
            ).int32(message.travelTimeToStop);
          if (message.stopId != null && Object.hasOwnProperty.call(message, "stopId"))
            writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).string(message.stopId);
          if (message.$unknowns != null && Object.hasOwnProperty.call(message, "$unknowns"))
            for (var i = 0; i < message.$unknowns.length; ++i)
              writer.raw(message.$unknowns[i]);
          return writer;
        };
        ReplacementStop.encodeDelimited = function encodeDelimited(message, writer) {
          return this.encode(message, writer).ldelim();
        };
        ReplacementStop.decode = function decode(reader, length, _end, _depth, _target) {
          if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $Reader.recursionLimit)
            throw Error("max depth exceeded");
          var end = length === void 0 ? reader.len : reader.pos + length, message = _target || new $root.transit_realtime.ReplacementStop();
          while (reader.pos < end) {
            var start = reader.pos;
            var tag = reader.tag();
            if (tag === _end) {
              _end = void 0;
              break;
            }
            var wireType = tag & 7;
            switch (tag >>>= 3) {
              case 1: {
                if (wireType !== 0)
                  break;
                message.travelTimeToStop = reader.int32();
                continue;
              }
              case 2: {
                if (wireType !== 2)
                  break;
                message.stopId = reader.string();
                continue;
              }
            }
            reader.skipType(wireType, _depth, tag);
            $util.makeProp(message, "$unknowns", false);
            (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
          }
          if (_end !== void 0)
            throw Error("missing end group");
          return message;
        };
        ReplacementStop.decodeDelimited = function decodeDelimited(reader) {
          if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
          return this.decode(reader, reader.uint32());
        };
        ReplacementStop.verify = function verify(message, _depth) {
          if (typeof message !== "object" || message === null)
            return "object expected";
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            return "max depth exceeded";
          if (message.travelTimeToStop != null && message.hasOwnProperty("travelTimeToStop")) {
            if (!$util.isInteger(message.travelTimeToStop))
              return "travelTimeToStop: integer expected";
          }
          if (message.stopId != null && message.hasOwnProperty("stopId")) {
            if (!$util.isString(message.stopId))
              return "stopId: string expected";
          }
          return null;
        };
        ReplacementStop.fromObject = function fromObject(object, _depth) {
          if (object instanceof $root.transit_realtime.ReplacementStop)
            return object;
          if (_depth === void 0)
            _depth = 0;
          if (_depth > $util.recursionLimit)
            throw Error("max depth exceeded");
          var message = new $root.transit_realtime.ReplacementStop();
          if (object.travelTimeToStop != null)
            message.travelTimeToStop = object.travelTimeToStop | 0;
          if (object.stopId != null)
            message.stopId = String(object.stopId);
          return message;
        };
        ReplacementStop.toObject = function toObject(message, options) {
          if (!options)
            options = {};
          var object = {};
          if (options.defaults) {
            object.travelTimeToStop = 0;
            object.stopId = "";
          }
          if (message.travelTimeToStop != null && message.hasOwnProperty("travelTimeToStop"))
            object.travelTimeToStop = message.travelTimeToStop;
          if (message.stopId != null && message.hasOwnProperty("stopId"))
            object.stopId = message.stopId;
          return object;
        };
        ReplacementStop.prototype.toJSON = function toJSON() {
          return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };
        ReplacementStop.getTypeUrl = function getTypeUrl(prefix) {
          if (prefix === void 0)
            prefix = "type.googleapis.com";
          return prefix + "/transit_realtime.ReplacementStop";
        };
        return ReplacementStop;
      })();
      return transit_realtime2;
    })();
    module2.exports = $root;
  }
});

// node_modules/adm-zip/util/constants.js
var require_constants = __commonJS({
  "node_modules/adm-zip/util/constants.js"(exports2, module2) {
    module2.exports = {
      /* The local file header */
      LOCHDR: 30,
      // LOC header size
      LOCSIG: 67324752,
      // "PK\003\004"
      LOCVER: 4,
      // version needed to extract
      LOCFLG: 6,
      // general purpose bit flag
      LOCHOW: 8,
      // compression method
      LOCTIM: 10,
      // modification time (2 bytes time, 2 bytes date)
      LOCCRC: 14,
      // uncompressed file crc-32 value
      LOCSIZ: 18,
      // compressed size
      LOCLEN: 22,
      // uncompressed size
      LOCNAM: 26,
      // filename length
      LOCEXT: 28,
      // extra field length
      /* The Data descriptor */
      EXTSIG: 134695760,
      // "PK\007\008"
      EXTHDR: 16,
      // EXT header size
      EXTCRC: 4,
      // uncompressed file crc-32 value
      EXTSIZ: 8,
      // compressed size
      EXTLEN: 12,
      // uncompressed size
      /* The central directory file header */
      CENHDR: 46,
      // CEN header size
      CENSIG: 33639248,
      // "PK\001\002"
      CENVEM: 4,
      // version made by
      CENVER: 6,
      // version needed to extract
      CENFLG: 8,
      // encrypt, decrypt flags
      CENHOW: 10,
      // compression method
      CENTIM: 12,
      // modification time (2 bytes time, 2 bytes date)
      CENCRC: 16,
      // uncompressed file crc-32 value
      CENSIZ: 20,
      // compressed size
      CENLEN: 24,
      // uncompressed size
      CENNAM: 28,
      // filename length
      CENEXT: 30,
      // extra field length
      CENCOM: 32,
      // file comment length
      CENDSK: 34,
      // volume number start
      CENATT: 36,
      // internal file attributes
      CENATX: 38,
      // external file attributes (host system dependent)
      CENOFF: 42,
      // LOC header offset
      /* The entries in the end of central directory */
      ENDHDR: 22,
      // END header size
      ENDSIG: 101010256,
      // "PK\005\006"
      ENDSUB: 8,
      // number of entries on this disk
      ENDTOT: 10,
      // total number of entries
      ENDSIZ: 12,
      // central directory size in bytes
      ENDOFF: 16,
      // offset of first CEN header
      ENDCOM: 20,
      // zip file comment length
      END64HDR: 20,
      // zip64 END header size
      END64SIG: 117853008,
      // zip64 Locator signature, "PK\006\007"
      END64START: 4,
      // number of the disk with the start of the zip64
      END64OFF: 8,
      // relative offset of the zip64 end of central directory
      END64NUMDISKS: 16,
      // total number of disks
      ZIP64SIG: 101075792,
      // zip64 signature, "PK\006\006"
      ZIP64HDR: 56,
      // zip64 record minimum size
      ZIP64LEAD: 12,
      // leading bytes at the start of the record, not counted by the value stored in ZIP64SIZE
      ZIP64SIZE: 4,
      // zip64 size of the central directory record
      ZIP64VEM: 12,
      // zip64 version made by
      ZIP64VER: 14,
      // zip64 version needed to extract
      ZIP64DSK: 16,
      // zip64 number of this disk
      ZIP64DSKDIR: 20,
      // number of the disk with the start of the record directory
      ZIP64SUB: 24,
      // number of entries on this disk
      ZIP64TOT: 32,
      // total number of entries
      ZIP64SIZB: 40,
      // zip64 central directory size in bytes
      ZIP64OFF: 48,
      // offset of start of central directory with respect to the starting disk number
      ZIP64EXTRA: 56,
      // extensible data sector
      /* Compression methods */
      STORED: 0,
      // no compression
      SHRUNK: 1,
      // shrunk
      REDUCED1: 2,
      // reduced with compression factor 1
      REDUCED2: 3,
      // reduced with compression factor 2
      REDUCED3: 4,
      // reduced with compression factor 3
      REDUCED4: 5,
      // reduced with compression factor 4
      IMPLODED: 6,
      // imploded
      // 7 reserved for Tokenizing compression algorithm
      DEFLATED: 8,
      // deflated
      ENHANCED_DEFLATED: 9,
      // enhanced deflated
      PKWARE: 10,
      // PKWare DCL imploded
      // 11 reserved by PKWARE
      BZIP2: 12,
      //  compressed using BZIP2
      // 13 reserved by PKWARE
      LZMA: 14,
      // LZMA
      // 15-17 reserved by PKWARE
      IBM_TERSE: 18,
      // compressed using IBM TERSE
      IBM_LZ77: 19,
      // IBM LZ77 z
      AES_ENCRYPT: 99,
      // WinZIP AES encryption method
      /* General purpose bit flag */
      // values can obtained with expression 2**bitnr
      FLG_ENC: 1,
      // Bit 0: encrypted file
      FLG_COMP1: 2,
      // Bit 1, compression option
      FLG_COMP2: 4,
      // Bit 2, compression option
      FLG_DESC: 8,
      // Bit 3, data descriptor
      FLG_ENH: 16,
      // Bit 4, enhanced deflating
      FLG_PATCH: 32,
      // Bit 5, indicates that the file is compressed patched data.
      FLG_STR: 64,
      // Bit 6, strong encryption (patented)
      // Bits 7-10: Currently unused.
      FLG_EFS: 2048,
      // Bit 11: Language encoding flag (EFS)
      // Bit 12: Reserved by PKWARE for enhanced compression.
      // Bit 13: encrypted the Central Directory (patented).
      // Bits 14-15: Reserved by PKWARE.
      FLG_MSK: 4096,
      // mask header values
      /* Load type */
      FILE: 2,
      BUFFER: 1,
      NONE: 0,
      /* 4.5 Extensible data fields */
      EF_ID: 0,
      EF_SIZE: 2,
      /* Header IDs */
      ID_ZIP64: 1,
      ID_AVINFO: 7,
      ID_PFS: 8,
      ID_OS2: 9,
      ID_NTFS: 10,
      ID_OPENVMS: 12,
      ID_UNIX: 13,
      ID_FORK: 14,
      ID_PATCH: 15,
      ID_X509_PKCS7: 20,
      ID_X509_CERTID_F: 21,
      ID_X509_CERTID_C: 22,
      ID_STRONGENC: 23,
      ID_RECORD_MGT: 24,
      ID_X509_PKCS7_RL: 25,
      ID_IBM1: 101,
      ID_IBM2: 102,
      ID_POSZIP: 18064,
      EF_ZIP64_OR_32: 4294967295,
      EF_ZIP64_OR_16: 65535,
      EF_ZIP64_SUNCOMP: 0,
      EF_ZIP64_SCOMP: 8,
      EF_ZIP64_RHO: 16,
      EF_ZIP64_DSN: 24
    };
  }
});

// node_modules/adm-zip/util/errors.js
var require_errors = __commonJS({
  "node_modules/adm-zip/util/errors.js"(exports2) {
    var errors = {
      /* Header error messages */
      INVALID_LOC: "Invalid LOC header (bad signature)",
      INVALID_CEN: "Invalid CEN header (bad signature)",
      INVALID_END: "Invalid END header (bad signature)",
      /* Descriptor */
      DESCRIPTOR_NOT_EXIST: "No descriptor present",
      DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
      DESCRIPTOR_FAULTY: "Descriptor data is malformed",
      /* ZipEntry error messages*/
      NO_DATA: "Nothing to decompress",
      BAD_CRC: "CRC32 checksum failed {0}",
      FILE_IN_THE_WAY: "There is a file in the way: {0}",
      UNKNOWN_METHOD: "Invalid/unsupported compression method",
      /* Inflater error messages */
      AVAIL_DATA: "inflate::Available inflate data did not terminate",
      INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
      TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
      INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
      INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
      INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
      INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
      INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
      INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
      INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
      /* ADM-ZIP error messages */
      CANT_EXTRACT_FILE: "Could not extract the file",
      CANT_OVERRIDE: "Target file already exists",
      DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
      NO_ZIP: "No zip file was loaded",
      NO_ENTRY: "Entry doesn't exist",
      DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
      FILE_NOT_FOUND: 'File not found: "{0}"',
      NOT_IMPLEMENTED: "Not implemented",
      INVALID_FILENAME: "Invalid filename",
      INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
      INVALID_PASS_PARAM: "Incompatible password parameter",
      WRONG_PASSWORD: "Wrong Password",
      /* ADM-ZIP */
      COMMENT_TOO_LONG: "Comment is too long",
      // Comment can be max 65535 bytes long (NOTE: some non-US characters may take more space)
      EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
    };
    function E(message) {
      return function(...args) {
        if (args.length) {
          message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
        }
        return new Error("ADM-ZIP: " + message);
      };
    }
    for (const msg of Object.keys(errors)) {
      exports2[msg] = E(errors[msg]);
    }
  }
});

// node_modules/adm-zip/util/utils.js
var require_utils = __commonJS({
  "node_modules/adm-zip/util/utils.js"(exports2, module2) {
    var fsystem = require("fs");
    var pth = require("path");
    var Constants = require_constants();
    var Errors = require_errors();
    var isWin = typeof process === "object" && "win32" === process.platform;
    var is_Obj = (obj) => typeof obj === "object" && obj !== null;
    var crcTable = new Uint32Array(256).map((t, c) => {
      for (let k = 0; k < 8; k++) {
        if ((c & 1) !== 0) {
          c = 3988292384 ^ c >>> 1;
        } else {
          c >>>= 1;
        }
      }
      return c >>> 0;
    });
    function Utils(opts) {
      this.sep = pth.sep;
      this.fs = fsystem;
      if (is_Obj(opts)) {
        if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
          this.fs = opts.fs;
        }
      }
    }
    module2.exports = Utils;
    Utils.prototype.makeDir = function(folder) {
      const self2 = this;
      function mkdirSync(fpath) {
        let resolvedPath = fpath.split(self2.sep)[0];
        fpath.split(self2.sep).forEach(function(name) {
          if (!name || name.substr(-1, 1) === ":") return;
          resolvedPath += self2.sep + name;
          var stat2;
          try {
            stat2 = self2.fs.statSync(resolvedPath);
          } catch (e) {
            if (e.message && e.message.startsWith("ENOENT")) {
              self2.fs.mkdirSync(resolvedPath);
            } else {
              throw e;
            }
          }
          if (stat2 && stat2.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
        });
      }
      mkdirSync(folder);
    };
    Utils.prototype.writeFileTo = function(path, content, overwrite, attr) {
      const self2 = this;
      if (self2.fs.existsSync(path)) {
        if (!overwrite) return false;
        var stat2 = self2.fs.statSync(path);
        if (stat2.isDirectory()) {
          return false;
        }
      }
      var folder = pth.dirname(path);
      if (!self2.fs.existsSync(folder)) {
        self2.makeDir(folder);
      }
      var fd;
      try {
        fd = self2.fs.openSync(path, "w", 438);
      } catch (e) {
        self2.fs.chmodSync(path, 438);
        fd = self2.fs.openSync(path, "w", 438);
      }
      if (fd) {
        try {
          self2.fs.writeSync(fd, content, 0, content.length, 0);
        } finally {
          self2.fs.closeSync(fd);
        }
      }
      self2.fs.chmodSync(path, attr || 438);
      return true;
    };
    Utils.prototype.writeFileToAsync = function(path, content, overwrite, attr, callback) {
      if (typeof attr === "function") {
        callback = attr;
        attr = void 0;
      }
      const self2 = this;
      self2.fs.exists(path, function(exist) {
        if (exist && !overwrite) return callback(false);
        self2.fs.stat(path, function(err, stat2) {
          if (exist && stat2 && stat2.isDirectory()) {
            return callback(false);
          }
          var folder = pth.dirname(path);
          self2.fs.exists(folder, function(exists) {
            if (!exists) {
              try {
                self2.makeDir(folder);
              } catch (e) {
                return callback(false);
              }
            }
            const writeToFd = function(fd) {
              self2.fs.write(fd, content, 0, content.length, 0, function(writeErr) {
                self2.fs.close(fd, function() {
                  if (writeErr) return callback(false);
                  self2.fs.chmod(path, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            };
            self2.fs.open(path, "w", 438, function(err2, fd) {
              if (err2) {
                self2.fs.chmod(path, 438, function() {
                  self2.fs.open(path, "w", 438, function(retryErr, fd2) {
                    if (retryErr || !fd2) return callback(false);
                    writeToFd(fd2);
                  });
                });
              } else if (fd) {
                writeToFd(fd);
              } else {
                callback(false);
              }
            });
          });
        });
      });
    };
    Utils.prototype.findFiles = function(path) {
      const self2 = this;
      function findSync(dir, pattern, recursive, visited) {
        if (typeof pattern === "boolean") {
          recursive = pattern;
          pattern = void 0;
        }
        let files = [];
        self2.fs.readdirSync(dir).forEach(function(file) {
          const path2 = pth.join(dir, file);
          const stat2 = self2.fs.statSync(path2);
          if (!pattern || pattern.test(path2)) {
            files.push(pth.normalize(path2) + (stat2.isDirectory() ? self2.sep : ""));
          }
          if (stat2.isDirectory() && recursive) {
            const realDir = self2.fs.realpathSync(path2);
            if (!visited.has(realDir)) {
              visited.add(realDir);
              files = files.concat(findSync(path2, pattern, recursive, visited));
            }
          }
        });
        return files;
      }
      return findSync(path, void 0, true, /* @__PURE__ */ new Set([self2.fs.realpathSync(path)]));
    };
    Utils.prototype.findFilesAsync = function(dir, cb) {
      const self2 = this;
      const results = [];
      let finished = false;
      const finish = function(err) {
        if (finished) return;
        finished = true;
        cb(err, err ? void 0 : results);
      };
      const walk = function(dir2, visited, done) {
        self2.fs.readdir(dir2, function(err, list) {
          if (err) return done(err);
          let pending = list.length;
          if (!pending) return done();
          list.forEach(function(name) {
            const file = pth.join(dir2, name);
            self2.fs.stat(file, function(err2, stat2) {
              if (err2) return done(err2);
              if (!stat2) {
                if (!--pending) done();
                return;
              }
              results.push(pth.normalize(file) + (stat2.isDirectory() ? self2.sep : ""));
              if (!stat2.isDirectory()) {
                if (!--pending) done();
                return;
              }
              self2.fs.realpath(file, function(err3, realDir) {
                if (err3) return done(err3);
                if (visited.has(realDir)) {
                  if (!--pending) done();
                  return;
                }
                visited.add(realDir);
                walk(file, visited, function(err4) {
                  if (err4) return done(err4);
                  if (!--pending) done();
                });
              });
            });
          });
        });
      };
      self2.fs.realpath(dir, function(err, realDir) {
        if (err) return finish(err);
        walk(dir, /* @__PURE__ */ new Set([realDir]), finish);
      });
    };
    Utils.prototype.getAttributes = function() {
    };
    Utils.prototype.setAttributes = function() {
    };
    Utils.crc32update = function(crc, byte) {
      return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
    };
    Utils.crc32 = function(buf) {
      if (typeof buf === "string") {
        buf = Buffer.from(buf, "utf8");
      }
      let len = buf.length;
      let crc = ~0;
      for (let off = 0; off < len; ) crc = Utils.crc32update(crc, buf[off++]);
      return ~crc >>> 0;
    };
    Utils.methodToString = function(method) {
      switch (method) {
        case Constants.STORED:
          return "STORED (" + method + ")";
        case Constants.DEFLATED:
          return "DEFLATED (" + method + ")";
        default:
          return "UNSUPPORTED (" + method + ")";
      }
    };
    Utils.canonical = function(path) {
      if (!path) return "";
      const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
      return pth.join(".", safeSuffix);
    };
    Utils.zipnamefix = function(path) {
      if (!path) return "";
      const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
      return pth.posix.join(".", safeSuffix);
    };
    Utils.findLast = function(arr, callback) {
      if (!Array.isArray(arr)) throw new TypeError("arr is not array");
      const len = arr.length >>> 0;
      for (let i = len - 1; i >= 0; i--) {
        if (callback(arr[i], i, arr)) {
          return arr[i];
        }
      }
      return void 0;
    };
    Utils.sanitize = function(prefix, name) {
      prefix = pth.resolve(pth.normalize(prefix));
      var parts = name.split("/");
      for (var i = 0, l = parts.length; i < l; i++) {
        var path = pth.normalize(pth.join(prefix, parts.slice(i, l).join(pth.sep)));
        if (path === prefix || path.startsWith(prefix + pth.sep)) {
          return path;
        }
      }
      return pth.normalize(pth.join(prefix, pth.basename(name)));
    };
    Utils.toBuffer = function toBuffer(input, encoder) {
      if (Buffer.isBuffer(input)) {
        return input;
      } else if (input instanceof Uint8Array) {
        return Buffer.from(input);
      } else {
        return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
      }
    };
    Utils.readBigUInt64LE = function(buffer, index) {
      const lo = buffer.readUInt32LE(index);
      const hi = buffer.readUInt32LE(index + 4);
      return hi * 4294967296 + lo;
    };
    Utils.writeBigUInt64LE = function(buffer, value, index) {
      const lo = value >>> 0;
      const hi = Math.floor(value / 4294967296) >>> 0;
      buffer.writeUInt32LE(lo, index);
      buffer.writeUInt32LE(hi, index + 4);
    };
    Utils.fromDOS2Date = function(val) {
      return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
    };
    Utils.fromDate2DOS = function(val) {
      let date = 0;
      let time = 0;
      if (val.getFullYear() > 1979) {
        date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
        time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
      }
      return date << 16 | time;
    };
    Utils.isWin = isWin;
    Utils.crcTable = crcTable;
  }
});

// node_modules/adm-zip/util/fattr.js
var require_fattr = __commonJS({
  "node_modules/adm-zip/util/fattr.js"(exports2, module2) {
    var pth = require("path");
    module2.exports = function(path, { fs }) {
      var _path = path || "", _obj = newAttr(), _stat = null;
      function newAttr() {
        return {
          directory: false,
          readonly: false,
          hidden: false,
          executable: false,
          mtime: 0,
          atime: 0
        };
      }
      if (_path && fs.existsSync(_path)) {
        _stat = fs.statSync(_path);
        _obj.directory = _stat.isDirectory();
        _obj.mtime = _stat.mtime;
        _obj.atime = _stat.atime;
        _obj.executable = (73 & _stat.mode) !== 0;
        _obj.readonly = (128 & _stat.mode) === 0;
        _obj.hidden = pth.basename(_path)[0] === ".";
      } else {
        console.warn("Invalid path: " + _path);
      }
      return {
        get directory() {
          return _obj.directory;
        },
        get readOnly() {
          return _obj.readonly;
        },
        get hidden() {
          return _obj.hidden;
        },
        get mtime() {
          return _obj.mtime;
        },
        get atime() {
          return _obj.atime;
        },
        get executable() {
          return _obj.executable;
        },
        decodeAttributes: function() {
        },
        encodeAttributes: function() {
        },
        toJSON: function() {
          return {
            path: _path,
            isDirectory: _obj.directory,
            isReadOnly: _obj.readonly,
            isHidden: _obj.hidden,
            isExecutable: _obj.executable,
            mTime: _obj.mtime,
            aTime: _obj.atime
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/util/decoder.js
var require_decoder = __commonJS({
  "node_modules/adm-zip/util/decoder.js"(exports2, module2) {
    module2.exports = {
      efs: true,
      encode: (data) => Buffer.from(data, "utf8"),
      decode: (data) => data.toString("utf8")
    };
  }
});

// node_modules/adm-zip/util/index.js
var require_util = __commonJS({
  "node_modules/adm-zip/util/index.js"(exports2, module2) {
    module2.exports = require_utils();
    module2.exports.Constants = require_constants();
    module2.exports.Errors = require_errors();
    module2.exports.FileAttr = require_fattr();
    module2.exports.decoder = require_decoder();
  }
});

// node_modules/adm-zip/headers/entryHeader.js
var require_entryHeader = __commonJS({
  "node_modules/adm-zip/headers/entryHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
      _verMade |= Utils.isWin ? 2560 : 768;
      _flags |= Constants.FLG_EFS;
      const _localHeader = {
        extraLen: 0
      };
      const uint32 = (val) => Math.max(0, val) >>> 0;
      const uint16 = (val) => Math.max(0, val) & 65535;
      const uint8 = (val) => Math.max(0, val) & 255;
      _time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
      return {
        get made() {
          return _verMade;
        },
        set made(val) {
          _verMade = val;
        },
        get version() {
          return _version;
        },
        set version(val) {
          _version = val;
        },
        get flags() {
          return _flags;
        },
        set flags(val) {
          _flags = val;
        },
        get flags_efs() {
          return (_flags & Constants.FLG_EFS) > 0;
        },
        set flags_efs(val) {
          if (val) {
            _flags |= Constants.FLG_EFS;
          } else {
            _flags &= ~Constants.FLG_EFS;
          }
        },
        get flags_desc() {
          return (_flags & Constants.FLG_DESC) > 0;
        },
        set flags_desc(val) {
          if (val) {
            _flags |= Constants.FLG_DESC;
          } else {
            _flags &= ~Constants.FLG_DESC;
          }
        },
        get method() {
          return _method;
        },
        set method(val) {
          switch (val) {
            case Constants.STORED:
              this.version = 10;
              break;
            case Constants.DEFLATED:
            default:
              this.version = 20;
          }
          _method = val;
        },
        get time() {
          return Utils.fromDOS2Date(this.timeval);
        },
        set time(val) {
          val = new Date(val);
          this.timeval = Utils.fromDate2DOS(val);
        },
        get timeval() {
          return _time;
        },
        set timeval(val) {
          _time = uint32(val);
        },
        get timeHighByte() {
          return uint8(_time >>> 8);
        },
        get crc() {
          return _crc;
        },
        set crc(val) {
          _crc = uint32(val);
        },
        get compressedSize() {
          return _compressedSize;
        },
        set compressedSize(val) {
          _compressedSize = uint32(val);
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = uint32(val);
        },
        get fileNameLength() {
          return _fnameLen;
        },
        set fileNameLength(val) {
          _fnameLen = val;
        },
        get extraLength() {
          return _extraLen;
        },
        set extraLength(val) {
          _extraLen = val;
        },
        get extraLocalLength() {
          return _localHeader.extraLen;
        },
        set extraLocalLength(val) {
          _localHeader.extraLen = val;
        },
        get commentLength() {
          return _comLen;
        },
        set commentLength(val) {
          _comLen = val;
        },
        get diskNumStart() {
          return _diskStart;
        },
        set diskNumStart(val) {
          _diskStart = uint32(val);
        },
        get inAttr() {
          return _inattr;
        },
        set inAttr(val) {
          _inattr = uint32(val);
        },
        get attr() {
          return _attr;
        },
        set attr(val) {
          _attr = uint32(val);
        },
        // get Unix file permissions
        get fileAttr() {
          return (_attr || 0) >> 16 & 4095;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = uint32(val);
        },
        get encrypted() {
          return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
        },
        get centralHeaderSize() {
          return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
        },
        get realDataOffset() {
          return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
        },
        get localHeader() {
          return _localHeader;
        },
        loadLocalHeaderFromBinary: function(input) {
          var data = input.slice(_offset, _offset + Constants.LOCHDR);
          if (data.readUInt32LE(0) !== Constants.LOCSIG) {
            throw Utils.Errors.INVALID_LOC();
          }
          _localHeader.version = data.readUInt16LE(Constants.LOCVER);
          _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
          _localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
          _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
          _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
          _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
          _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
          _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
          _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
          _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
          const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
          const extraEnd = extraStart + _localHeader.extraLen;
          return input.slice(extraStart, extraEnd);
        },
        loadFromBinary: function(data) {
          if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
            throw Utils.Errors.INVALID_CEN();
          }
          _verMade = data.readUInt16LE(Constants.CENVEM);
          _version = data.readUInt16LE(Constants.CENVER);
          _flags = data.readUInt16LE(Constants.CENFLG);
          _method = data.readUInt16LE(Constants.CENHOW);
          _time = data.readUInt32LE(Constants.CENTIM);
          _crc = data.readUInt32LE(Constants.CENCRC);
          _compressedSize = data.readUInt32LE(Constants.CENSIZ);
          _size = data.readUInt32LE(Constants.CENLEN);
          _fnameLen = data.readUInt16LE(Constants.CENNAM);
          _extraLen = data.readUInt16LE(Constants.CENEXT);
          _comLen = data.readUInt16LE(Constants.CENCOM);
          _diskStart = data.readUInt16LE(Constants.CENDSK);
          _inattr = data.readUInt16LE(Constants.CENATT);
          _attr = data.readUInt32LE(Constants.CENATX);
          _offset = data.readUInt32LE(Constants.CENOFF);
        },
        localHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.LOCHDR);
          data.writeUInt32LE(Constants.LOCSIG, 0);
          data.writeUInt16LE(_version, Constants.LOCVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.LOCFLG);
          data.writeUInt16LE(_method, Constants.LOCHOW);
          data.writeUInt32LE(_time, Constants.LOCTIM);
          data.writeUInt32LE(_crc, Constants.LOCCRC);
          data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
          data.writeUInt32LE(_size, Constants.LOCLEN);
          data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
          data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
          return data;
        },
        centralHeaderToBinary: function() {
          var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
          data.writeUInt32LE(Constants.CENSIG, 0);
          data.writeUInt16LE(_verMade, Constants.CENVEM);
          data.writeUInt16LE(_version, Constants.CENVER);
          data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.CENFLG);
          data.writeUInt16LE(_method, Constants.CENHOW);
          data.writeUInt32LE(_time, Constants.CENTIM);
          data.writeUInt32LE(_crc, Constants.CENCRC);
          data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
          data.writeUInt32LE(_size, Constants.CENLEN);
          data.writeUInt16LE(_fnameLen, Constants.CENNAM);
          data.writeUInt16LE(_extraLen, Constants.CENEXT);
          data.writeUInt16LE(_comLen, Constants.CENCOM);
          data.writeUInt16LE(_diskStart, Constants.CENDSK);
          data.writeUInt16LE(_inattr, Constants.CENATT);
          data.writeUInt32LE(_attr, Constants.CENATX);
          data.writeUInt32LE(_offset, Constants.CENOFF);
          return data;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return nr + " bytes";
          };
          return {
            made: _verMade,
            version: _version,
            flags: _flags,
            method: Utils.methodToString(_method),
            time: this.time,
            crc: "0x" + _crc.toString(16).toUpperCase(),
            compressedSize: bytes(_compressedSize),
            size: bytes(_size),
            fileNameLength: bytes(_fnameLen),
            extraLength: bytes(_extraLen),
            commentLength: bytes(_comLen),
            diskNumStart: _diskStart,
            inAttr: _inattr,
            attr: _attr,
            offset: _offset,
            centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/mainHeader.js
var require_mainHeader = __commonJS({
  "node_modules/adm-zip/headers/mainHeader.js"(exports2, module2) {
    var Utils = require_util();
    var Constants = Utils.Constants;
    module2.exports = function() {
      var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
      const needsZip64 = () => _volumeEntries > Constants.EF_ZIP64_OR_16 || _totalEntries > Constants.EF_ZIP64_OR_16 || _size > Constants.EF_ZIP64_OR_32 || _offset > Constants.EF_ZIP64_OR_32;
      return {
        get diskEntries() {
          return _volumeEntries;
        },
        set diskEntries(val) {
          _volumeEntries = _totalEntries = val;
        },
        get totalEntries() {
          return _totalEntries;
        },
        set totalEntries(val) {
          _totalEntries = _volumeEntries = val;
        },
        get size() {
          return _size;
        },
        set size(val) {
          _size = val;
        },
        get offset() {
          return _offset;
        },
        set offset(val) {
          _offset = val;
        },
        get commentLength() {
          return _commentLength;
        },
        set commentLength(val) {
          _commentLength = val;
        },
        get mainHeaderSize() {
          return (needsZip64() ? Constants.ZIP64HDR + Constants.END64HDR : 0) + Constants.ENDHDR + _commentLength;
        },
        loadFromBinary: function(data) {
          if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
            throw Utils.Errors.INVALID_END();
          }
          if (data.readUInt32LE(0) === Constants.ENDSIG) {
            _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
            _totalEntries = data.readUInt16LE(Constants.ENDTOT);
            _size = data.readUInt32LE(Constants.ENDSIZ);
            _offset = data.readUInt32LE(Constants.ENDOFF);
            _commentLength = data.readUInt16LE(Constants.ENDCOM);
          } else {
            _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
            _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
            _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZB);
            _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
            _commentLength = 0;
          }
        },
        toBinary: function() {
          if (!needsZip64()) {
            var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
            b.writeUInt32LE(Constants.ENDSIG, 0);
            b.writeUInt32LE(0, 4);
            b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
            b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
            b.writeUInt32LE(_size, Constants.ENDSIZ);
            b.writeUInt32LE(_offset, Constants.ENDOFF);
            b.writeUInt16LE(_commentLength, Constants.ENDCOM);
            b.fill(" ", Constants.ENDHDR);
            return b;
          }
          var b = Buffer.alloc(this.mainHeaderSize);
          let offset = 0;
          b.writeUInt32LE(Constants.ZIP64SIG, offset);
          Utils.writeBigUInt64LE(b, Constants.ZIP64HDR - Constants.ZIP64LEAD, offset + Constants.ZIP64SIZE);
          b.writeUInt16LE(45, offset + Constants.ZIP64VEM);
          b.writeUInt16LE(45, offset + Constants.ZIP64VER);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSK);
          b.writeUInt32LE(0, offset + Constants.ZIP64DSKDIR);
          Utils.writeBigUInt64LE(b, _volumeEntries, offset + Constants.ZIP64SUB);
          Utils.writeBigUInt64LE(b, _totalEntries, offset + Constants.ZIP64TOT);
          Utils.writeBigUInt64LE(b, _size, offset + Constants.ZIP64SIZB);
          Utils.writeBigUInt64LE(b, _offset, offset + Constants.ZIP64OFF);
          const zip64EndOffset = _offset + _size;
          offset += Constants.ZIP64HDR;
          b.writeUInt32LE(Constants.END64SIG, offset);
          b.writeUInt32LE(0, offset + Constants.END64START);
          Utils.writeBigUInt64LE(b, zip64EndOffset, offset + Constants.END64OFF);
          b.writeUInt32LE(1, offset + Constants.END64NUMDISKS);
          offset += Constants.END64HDR;
          b.writeUInt32LE(Constants.ENDSIG, offset);
          b.writeUInt32LE(0, offset + 4);
          b.writeUInt16LE(Math.min(_volumeEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDSUB);
          b.writeUInt16LE(Math.min(_totalEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDTOT);
          b.writeUInt32LE(Math.min(_size, Constants.EF_ZIP64_OR_32), offset + Constants.ENDSIZ);
          b.writeUInt32LE(Math.min(_offset, Constants.EF_ZIP64_OR_32), offset + Constants.ENDOFF);
          b.writeUInt16LE(_commentLength, offset + Constants.ENDCOM);
          b.fill(" ", offset + Constants.ENDHDR);
          return b;
        },
        toJSON: function() {
          const offset = function(nr, len) {
            let offs = nr.toString(16).toUpperCase();
            while (offs.length < len) offs = "0" + offs;
            return "0x" + offs;
          };
          return {
            diskEntries: _volumeEntries,
            totalEntries: _totalEntries,
            size: _size + " bytes",
            offset: offset(_offset, 4),
            commentLength: _commentLength
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/headers/index.js
var require_headers = __commonJS({
  "node_modules/adm-zip/headers/index.js"(exports2) {
    exports2.EntryHeader = require_entryHeader();
    exports2.MainHeader = require_mainHeader();
  }
});

// node_modules/adm-zip/methods/deflater.js
var require_deflater = __commonJS({
  "node_modules/adm-zip/methods/deflater.js"(exports2, module2) {
    module2.exports = function(inbuf) {
      var zlib = require("zlib");
      var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
      return {
        deflate: function() {
          return zlib.deflateRawSync(inbuf, opts);
        },
        deflateAsync: function(callback) {
          var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
          tmp.on("data", function(data) {
            parts.push(data);
            total += data.length;
          });
          tmp.on("end", function() {
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/inflater.js
var require_inflater = __commonJS({
  "node_modules/adm-zip/methods/inflater.js"(exports2, module2) {
    var version = +(process?.versions?.node ?? "").split(".")[0] || 0;
    module2.exports = function(inbuf, expectedLength) {
      var zlib = require("zlib");
      const option = version >= 15 && expectedLength > 0 ? { maxOutputLength: expectedLength } : {};
      return {
        inflate: function() {
          return zlib.inflateRawSync(inbuf, option);
        },
        inflateAsync: function(callback) {
          var tmp = zlib.createInflateRaw(option), parts = [], total = 0;
          tmp.on("data", function(data) {
            parts.push(data);
            total += data.length;
          });
          tmp.on("end", function() {
            var buf = Buffer.alloc(total), written = 0;
            buf.fill(0);
            for (var i = 0; i < parts.length; i++) {
              var part = parts[i];
              part.copy(buf, written);
              written += part.length;
            }
            callback && callback(buf);
          });
          tmp.end(inbuf);
        }
      };
    };
  }
});

// node_modules/adm-zip/methods/zipcrypto.js
var require_zipcrypto = __commonJS({
  "node_modules/adm-zip/methods/zipcrypto.js"(exports2, module2) {
    "use strict";
    var { randomFillSync } = require("crypto");
    var Errors = require_errors();
    var crctable = new Uint32Array(256).map((t, crc) => {
      for (let j = 0; j < 8; j++) {
        if (0 !== (crc & 1)) {
          crc = crc >>> 1 ^ 3988292384;
        } else {
          crc >>>= 1;
        }
      }
      return crc >>> 0;
    });
    var uMul = (a, b) => Math.imul(a, b) >>> 0;
    var crc32update = (pCrc32, bval) => {
      return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
    };
    var genSalt = () => {
      if ("function" === typeof randomFillSync) {
        return randomFillSync(Buffer.alloc(12));
      } else {
        return genSalt.node();
      }
    };
    genSalt.node = () => {
      const salt = Buffer.alloc(12);
      const len = salt.length;
      for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
      return salt;
    };
    var config = {
      genSalt
    };
    function Initkeys(pw) {
      const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
      this.keys = new Uint32Array([305419896, 591751049, 878082192]);
      for (let i = 0; i < pass.length; i++) {
        this.updateKeys(pass[i]);
      }
    }
    Initkeys.prototype.updateKeys = function(byteValue) {
      const keys = this.keys;
      keys[0] = crc32update(keys[0], byteValue);
      keys[1] += keys[0] & 255;
      keys[1] = uMul(keys[1], 134775813) + 1;
      keys[2] = crc32update(keys[2], keys[1] >>> 24);
      return byteValue;
    };
    Initkeys.prototype.next = function() {
      const k = (this.keys[2] | 2) >>> 0;
      return uMul(k, k ^ 1) >> 8 & 255;
    };
    function make_decrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data) {
        const result = Buffer.alloc(data.length);
        let pos = 0;
        for (let c of data) {
          result[pos++] = keys.updateKeys(c ^ keys.next());
        }
        return result;
      };
    }
    function make_encrypter(pwd) {
      const keys = new Initkeys(pwd);
      return function(data, result, pos = 0) {
        if (!result) result = Buffer.alloc(data.length);
        for (let c of data) {
          const k = keys.next();
          result[pos++] = c ^ k;
          keys.updateKeys(c);
        }
        return result;
      };
    }
    function decrypt(data, header, pwd) {
      if (!data || !Buffer.isBuffer(data) || data.length < 12) {
        return Buffer.alloc(0);
      }
      const decrypter = make_decrypter(pwd);
      const salt = decrypter(data.slice(0, 12));
      const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
      if (salt[11] !== verifyByte) {
        throw Errors.WRONG_PASSWORD();
      }
      return decrypter(data.slice(12));
    }
    function _salter(data) {
      if (Buffer.isBuffer(data) && data.length >= 12) {
        config.genSalt = function() {
          return data.slice(0, 12);
        };
      } else if (data === "node") {
        config.genSalt = genSalt.node;
      } else {
        config.genSalt = genSalt;
      }
    }
    function encrypt(data, header, pwd, oldlike = false) {
      if (data == null) data = Buffer.alloc(0);
      if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
      const encrypter = make_encrypter(pwd);
      const salt = config.genSalt();
      salt[11] = header.crc >>> 24 & 255;
      if (oldlike) salt[10] = header.crc >>> 16 & 255;
      const result = Buffer.alloc(data.length + 12);
      encrypter(salt, result);
      return encrypter(data, result, 12);
    }
    module2.exports = { decrypt, encrypt, _salter };
  }
});

// node_modules/adm-zip/methods/index.js
var require_methods = __commonJS({
  "node_modules/adm-zip/methods/index.js"(exports2) {
    exports2.Deflater = require_deflater();
    exports2.Inflater = require_inflater();
    exports2.ZipCrypto = require_zipcrypto();
  }
});

// node_modules/adm-zip/zipEntry.js
var require_zipEntry = __commonJS({
  "node_modules/adm-zip/zipEntry.js"(exports2, module2) {
    var Utils = require_util();
    var Headers = require_headers();
    var Constants = Utils.Constants;
    var Methods = require_methods();
    module2.exports = function(options, input) {
      var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
      const opts = options;
      const decoder = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
      _efs = decoder.hasOwnProperty("efs") ? decoder.efs : false;
      function getCompressedDataFromZip() {
        if (!input || !(input instanceof Uint8Array)) {
          return Buffer.alloc(0);
        }
        _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
        return input.slice(_centralHeader.realDataOffset, _centralHeader.realDataOffset + _centralHeader.compressedSize);
      }
      function crc32OK(data) {
        const expectedCrc = _centralHeader.flags_desc || _centralHeader.localHeader.flags_desc ? _centralHeader.crc : _centralHeader.localHeader.crc;
        return Utils.crc32(data) === expectedCrc;
      }
      function decompress(async, callback, pass) {
        if (typeof callback === "undefined" && typeof async === "string") {
          pass = async;
          async = void 0;
        }
        if (_isDirectory) {
          if (async && callback) {
            callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
          }
          return Buffer.alloc(0);
        }
        var compressedData = getCompressedDataFromZip();
        if (compressedData.length === 0) {
          if (async && callback) callback(compressedData);
          return compressedData;
        }
        if (_centralHeader.encrypted) {
          if ("string" !== typeof pass && !Buffer.isBuffer(pass)) {
            throw Utils.Errors.INVALID_PASS_PARAM();
          }
          compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
        }
        var data;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            data = Buffer.alloc(compressedData.length);
            compressedData.copy(data);
            if (!crc32OK(data)) {
              if (async && callback) callback(data, Utils.Errors.BAD_CRC());
              throw Utils.Errors.BAD_CRC();
            } else {
              if (async && callback) callback(data);
              return data;
            }
          case Utils.Constants.DEFLATED:
            var inflater = new Methods.Inflater(compressedData, _centralHeader.size);
            if (!async) {
              data = inflater.inflate();
              if (!crc32OK(data)) {
                throw Utils.Errors.BAD_CRC(`"${decoder.decode(_entryName)}"`);
              }
              return data;
            } else {
              inflater.inflateAsync(function(result) {
                if (callback) {
                  if (!crc32OK(result)) {
                    callback(result, Utils.Errors.BAD_CRC());
                  } else {
                    callback(result);
                  }
                }
              });
            }
            break;
          default:
            if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
            throw Utils.Errors.UNKNOWN_METHOD();
        }
      }
      function compress(async, callback) {
        if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
          if (async && callback) callback(getCompressedDataFromZip());
          return getCompressedDataFromZip();
        }
        if (uncompressedData.length && !_isDirectory) {
          var compressedData;
          switch (_centralHeader.method) {
            case Utils.Constants.STORED:
              _centralHeader.compressedSize = _centralHeader.size;
              compressedData = Buffer.alloc(uncompressedData.length);
              uncompressedData.copy(compressedData);
              if (async && callback) callback(compressedData);
              return compressedData;
            default:
            case Utils.Constants.DEFLATED:
              var deflater = new Methods.Deflater(uncompressedData);
              if (!async) {
                var deflated = deflater.deflate();
                _centralHeader.compressedSize = deflated.length;
                return deflated;
              } else {
                deflater.deflateAsync(function(data) {
                  compressedData = Buffer.alloc(data.length);
                  _centralHeader.compressedSize = data.length;
                  data.copy(compressedData);
                  callback && callback(compressedData);
                });
              }
              deflater = null;
              break;
          }
        } else if (async && callback) {
          callback(Buffer.alloc(0));
        } else {
          return Buffer.alloc(0);
        }
      }
      function readUInt64LE(buffer, offset) {
        return Utils.readBigUInt64LE(buffer, offset);
      }
      function parseExtra(data) {
        try {
          var offset = 0;
          var signature, size, part;
          while (offset + 4 < data.length) {
            signature = data.readUInt16LE(offset);
            offset += 2;
            size = data.readUInt16LE(offset);
            offset += 2;
            part = data.slice(offset, offset + size);
            offset += size;
            if (Constants.ID_ZIP64 === signature) {
              parseZip64ExtendedInformation(part);
            }
          }
        } catch (error) {
          throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
        }
      }
      function parseZip64ExtendedInformation(data) {
        var size, compressedSize, offset, diskNumStart;
        if (data.length >= Constants.EF_ZIP64_SCOMP) {
          size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
          if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
            _centralHeader.size = size;
          }
        }
        if (data.length >= Constants.EF_ZIP64_RHO) {
          compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
          if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
            _centralHeader.compressedSize = compressedSize;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN) {
          offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
          if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
            _centralHeader.offset = offset;
          }
        }
        if (data.length >= Constants.EF_ZIP64_DSN + 4) {
          diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
          if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
            _centralHeader.diskNumStart = diskNumStart;
          }
        }
      }
      return {
        get entryName() {
          return decoder.decode(_entryName);
        },
        get rawEntryName() {
          return _entryName;
        },
        set entryName(val) {
          _entryName = Utils.toBuffer(val, decoder.encode);
          var lastChar = _entryName[_entryName.length - 1];
          _isDirectory = lastChar === 47 || lastChar === 92;
          _centralHeader.fileNameLength = _entryName.length;
        },
        get efs() {
          if (typeof _efs === "function") {
            return _efs(this.entryName);
          } else {
            return _efs;
          }
        },
        get extra() {
          return _extra;
        },
        set extra(val) {
          _extra = val;
          _centralHeader.extraLength = val.length;
          parseExtra(val);
        },
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          _centralHeader.commentLength = _comment.length;
          if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
        },
        get name() {
          const n = decoder.decode(_entryName);
          return _isDirectory ? n.replace(/[/\\]$/, "").split("/").pop() : n.split("/").pop();
        },
        get isDirectory() {
          return _isDirectory;
        },
        getCompressedData: function() {
          return compress(false, null);
        },
        getCompressedDataAsync: function(callback) {
          compress(true, callback);
        },
        setData: function(value) {
          uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
          if (!_isDirectory && uncompressedData.length) {
            _centralHeader.size = uncompressedData.length;
            _centralHeader.method = Utils.Constants.DEFLATED;
            _centralHeader.crc = Utils.crc32(value);
            _centralHeader.changed = true;
          } else {
            _centralHeader.method = Utils.Constants.STORED;
          }
        },
        getData: function(pass) {
          if (_centralHeader.changed) {
            return uncompressedData;
          } else {
            return decompress(false, null, pass);
          }
        },
        getDataAsync: function(callback, pass) {
          if (_centralHeader.changed) {
            callback(uncompressedData);
          } else {
            decompress(true, callback, pass);
          }
        },
        set attr(attr) {
          _centralHeader.attr = attr;
        },
        get attr() {
          return _centralHeader.attr;
        },
        set header(data) {
          _centralHeader.loadFromBinary(data);
        },
        get header() {
          return _centralHeader;
        },
        packCentralHeader: function() {
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLength = _extra.length;
          var header = _centralHeader.centralHeaderToBinary();
          var addpos = Utils.Constants.CENHDR;
          _entryName.copy(header, addpos);
          addpos += _entryName.length;
          _extra.copy(header, addpos);
          addpos += _centralHeader.extraLength;
          _comment.copy(header, addpos);
          return header;
        },
        packLocalHeader: function() {
          let addpos = 0;
          _centralHeader.flags_efs = this.efs;
          _centralHeader.extraLocalLength = _extralocal.length;
          const localHeaderBuf = _centralHeader.localHeaderToBinary();
          const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
          localHeaderBuf.copy(localHeader, addpos);
          addpos += localHeaderBuf.length;
          _entryName.copy(localHeader, addpos);
          addpos += _entryName.length;
          _extralocal.copy(localHeader, addpos);
          addpos += _extralocal.length;
          return localHeader;
        },
        toJSON: function() {
          const bytes = function(nr) {
            return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
          };
          return {
            entryName: this.entryName,
            name: this.name,
            comment: this.comment,
            isDirectory: this.isDirectory,
            header: _centralHeader.toJSON(),
            compressedData: bytes(input),
            data: bytes(uncompressedData)
          };
        },
        toString: function() {
          return JSON.stringify(this.toJSON(), null, "	");
        }
      };
    };
  }
});

// node_modules/adm-zip/zipFile.js
var require_zipFile = __commonJS({
  "node_modules/adm-zip/zipFile.js"(exports2, module2) {
    var ZipEntry = require_zipEntry();
    var Headers = require_headers();
    var Utils = require_util();
    module2.exports = function(inBuffer, options) {
      var entryList = [], entryTable = /* @__PURE__ */ Object.create(null), _comment = Buffer.alloc(0), mainHeader = new Headers.MainHeader(), loadedEntries = false;
      var password = null;
      const temporary = /* @__PURE__ */ new Set();
      const opts = options;
      const { noSort, decoder } = opts;
      if (inBuffer) {
        readMainHeader(opts.readEntries);
      } else {
        loadedEntries = true;
      }
      function makeTemporaryFolders() {
        const foldersList = /* @__PURE__ */ new Set();
        for (const elem of Object.keys(entryTable)) {
          const elements = elem.split("/");
          elements.pop();
          if (!elements.length) continue;
          for (let i = 0; i < elements.length; i++) {
            const sub = elements.slice(0, i + 1).join("/") + "/";
            foldersList.add(sub);
          }
        }
        for (const elem of foldersList) {
          if (!(elem in entryTable)) {
            const tempfolder = new ZipEntry(opts);
            tempfolder.entryName = elem;
            tempfolder.attr = 16;
            tempfolder.temporary = true;
            entryList.push(tempfolder);
            entryTable[tempfolder.entryName] = tempfolder;
            temporary.add(tempfolder);
          }
        }
      }
      function readEntries() {
        loadedEntries = true;
        entryTable = /* @__PURE__ */ Object.create(null);
        if (mainHeader.diskEntries > (inBuffer.length - mainHeader.offset) / Utils.Constants.CENHDR) {
          throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
        }
        entryList = new Array(mainHeader.diskEntries);
        var index = mainHeader.offset;
        for (var i = 0; i < entryList.length; i++) {
          var tmp = index, entry = new ZipEntry(opts, inBuffer);
          entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
          entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
          if (entry.header.extraLength) {
            entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
          }
          if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
          index += entry.header.centralHeaderSize;
          entryList[i] = entry;
          entryTable[entry.entryName] = entry;
        }
        temporary.clear();
        makeTemporaryFolders();
      }
      function readMainHeader(readNow) {
        var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
        const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
        if (trailingSpace) max = 0;
        for (i; i >= n; i--) {
          if (inBuffer[i] !== 80) continue;
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
            endOffset = i;
            commentEnd = i;
            endStart = i + Utils.Constants.ENDHDR;
            n = i - Utils.Constants.END64HDR;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
            n = max;
            continue;
          }
          if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
            endOffset = i;
            endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
            break;
          }
        }
        if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
        mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
        if (mainHeader.commentLength) {
          _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
        }
        if (readNow) readEntries();
      }
      function sortEntries() {
        if (entryList.length > 1 && !noSort) {
          entryList = entryList.map((entry) => ({ entry, key: entry.entryName.toLowerCase() })).sort((a, b) => a.key.localeCompare(b.key)).map((pair) => pair.entry);
        }
      }
      return {
        /**
         * Returns an array of ZipEntry objects existent in the current opened archive
         * @return Array
         */
        get entries() {
          if (!loadedEntries) {
            readEntries();
          }
          return entryList.filter((e) => !temporary.has(e));
        },
        /**
         * Archive comment
         * @return {String}
         */
        get comment() {
          return decoder.decode(_comment);
        },
        set comment(val) {
          _comment = Utils.toBuffer(val, decoder.encode);
          mainHeader.commentLength = _comment.length;
        },
        getEntryCount: function() {
          if (!loadedEntries) {
            return mainHeader.diskEntries;
          }
          return entryList.length;
        },
        forEach: function(callback) {
          this.entries.forEach(callback);
        },
        /**
         * Returns a reference to the entry with the given name or null if entry is inexistent
         *
         * @param entryName
         * @return ZipEntry
         */
        getEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          return entryTable[entryName] || null;
        },
        /**
         * Adds the given entry to the entry list
         *
         * @param entry
         */
        setEntry: function(entry) {
          if (!loadedEntries) {
            readEntries();
          }
          entryList.push(entry);
          entryTable[entry.entryName] = entry;
          mainHeader.totalEntries = entryList.length;
        },
        /**
         * Removes the file with the given name from the entry list.
         *
         * If the entry is a directory, then all nested files and directories will be removed
         * @param entryName
         * @returns {void}
         */
        deleteFile: function(entryName, withsubfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
          list.forEach(this.deleteEntry);
        },
        /**
         * Removes the entry with the given name from the entry list.
         *
         * @param {string} entryName
         * @returns {void}
         */
        deleteEntry: function(entryName) {
          if (!loadedEntries) {
            readEntries();
          }
          const entry = entryTable[entryName];
          const index = entryList.indexOf(entry);
          if (index >= 0) {
            entryList.splice(index, 1);
            delete entryTable[entryName];
            mainHeader.totalEntries = entryList.length;
          }
        },
        /**
         *  Iterates and returns all nested files and directories of the given entry
         *
         * @param entry
         * @return Array
         */
        getEntryChildren: function(entry, subfolders = true) {
          if (!loadedEntries) {
            readEntries();
          }
          if (typeof entry === "object") {
            if (entry.isDirectory && subfolders) {
              const list = [];
              const name = entry.entryName;
              for (const zipEntry of entryList) {
                if (zipEntry.entryName.startsWith(name)) {
                  list.push(zipEntry);
                }
              }
              return list;
            } else {
              return [entry];
            }
          }
          return [];
        },
        /**
         *  How many child elements entry has
         *
         * @param {ZipEntry} entry
         * @return {integer}
         */
        getChildCount: function(entry) {
          if (entry && entry.isDirectory) {
            const list = this.getEntryChildren(entry);
            return list.includes(entry) ? list.length - 1 : list.length;
          }
          return 0;
        },
        /**
         * Returns the zip file
         *
         * @return Buffer
         */
        compressToBuffer: function() {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const headerBlocks = [];
          let totalSize = 0;
          let dindex = 0;
          mainHeader.size = 0;
          mainHeader.offset = 0;
          let totalEntries = 0;
          for (const entry of this.entries) {
            const compressedData = entry.getCompressedData();
            entry.header.offset = dindex;
            const localHeader = entry.packLocalHeader();
            const dataLength = localHeader.length + compressedData.length;
            dindex += dataLength;
            dataBlock.push(localHeader);
            dataBlock.push(compressedData);
            const centralHeader = entry.packCentralHeader();
            headerBlocks.push(centralHeader);
            mainHeader.size += centralHeader.length;
            totalSize += dataLength + centralHeader.length;
            totalEntries++;
          }
          totalSize += mainHeader.mainHeaderSize;
          mainHeader.offset = dindex;
          mainHeader.totalEntries = totalEntries;
          dindex = 0;
          const outBuffer = Buffer.alloc(totalSize);
          for (const content of dataBlock) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          for (const content of headerBlocks) {
            content.copy(outBuffer, dindex);
            dindex += content.length;
          }
          const mh = mainHeader.toBinary();
          if (_comment) {
            _comment.copy(mh, mh.length - _comment.length);
          }
          mh.copy(outBuffer, dindex);
          inBuffer = outBuffer;
          loadedEntries = false;
          return outBuffer;
        },
        toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          try {
            if (!loadedEntries) {
              readEntries();
            }
            sortEntries();
            const dataBlock = [];
            const centralHeaders = [];
            let totalSize = 0;
            let dindex = 0;
            let totalEntries = 0;
            mainHeader.size = 0;
            mainHeader.offset = 0;
            const compress2Buffer = function(entryLists) {
              if (entryLists.length > 0) {
                const entry = entryLists.shift();
                const name = entry.entryName + entry.extra.toString();
                if (onItemStart) onItemStart(name);
                entry.getCompressedDataAsync(function(compressedData) {
                  if (onItemEnd) onItemEnd(name);
                  entry.header.offset = dindex;
                  const localHeader = entry.packLocalHeader();
                  const dataLength = localHeader.length + compressedData.length;
                  dindex += dataLength;
                  dataBlock.push(localHeader);
                  dataBlock.push(compressedData);
                  const centalHeader = entry.packCentralHeader();
                  centralHeaders.push(centalHeader);
                  mainHeader.size += centalHeader.length;
                  totalSize += dataLength + centalHeader.length;
                  totalEntries++;
                  compress2Buffer(entryLists);
                });
              } else {
                totalSize += mainHeader.mainHeaderSize;
                mainHeader.offset = dindex;
                mainHeader.totalEntries = totalEntries;
                dindex = 0;
                const outBuffer = Buffer.alloc(totalSize);
                dataBlock.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                centralHeaders.forEach(function(content) {
                  content.copy(outBuffer, dindex);
                  dindex += content.length;
                });
                const mh = mainHeader.toBinary();
                if (_comment) {
                  _comment.copy(mh, mh.length - _comment.length);
                }
                mh.copy(outBuffer, dindex);
                inBuffer = outBuffer;
                loadedEntries = false;
                onSuccess(outBuffer);
              }
            };
            compress2Buffer(Array.from(this.entries));
          } catch (e) {
            onFail(e);
          }
        }
      };
    };
  }
});

// node_modules/adm-zip/adm-zip.js
var require_adm_zip = __commonJS({
  "node_modules/adm-zip/adm-zip.js"(exports2, module2) {
    var Utils = require_util();
    var pth = require("path");
    var ZipEntry = require_zipEntry();
    var ZipFile = require_zipFile();
    var get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
    var get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
    var get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
    var defaultOptions = {
      // option "noSort" : if true it disables files sorting
      noSort: false,
      // read entries during load (initial loading may be slower)
      readEntries: false,
      // default method is none
      method: Utils.Constants.NONE,
      // file system
      fs: null
    };
    module2.exports = function(input, options) {
      let inBuffer = null;
      const opts = Object.assign(/* @__PURE__ */ Object.create(null), defaultOptions);
      if (input && "object" === typeof input) {
        if (!(input instanceof Uint8Array)) {
          Object.assign(opts, input);
          input = opts.input ? opts.input : void 0;
          if (opts.input) delete opts.input;
        }
        if (Buffer.isBuffer(input)) {
          inBuffer = input;
          opts.method = Utils.Constants.BUFFER;
          input = void 0;
        }
      }
      Object.assign(opts, options);
      const filetools = new Utils(opts);
      const applyDirAttributes = (dirEntries) => {
        dirEntries.filter((d) => d.attr).sort((a, b) => b.path.length - a.path.length).forEach((d) => filetools.fs.chmodSync(d.path, d.attr));
      };
      if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
        opts.decoder = Utils.decoder;
      }
      if (input && "string" === typeof input) {
        if (filetools.fs.existsSync(input)) {
          opts.method = Utils.Constants.FILE;
          opts.filename = input;
          inBuffer = filetools.fs.readFileSync(input);
        } else {
          throw Utils.Errors.INVALID_FILENAME();
        }
      }
      const _zip = new ZipFile(inBuffer, opts);
      const { canonical, sanitize, zipnamefix } = Utils;
      function getEntry(entry) {
        if (entry && _zip) {
          var item;
          if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
          if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
          if (item) {
            return item;
          }
        }
        return null;
      }
      function fixPath(zipPath) {
        const { join: join3, normalize, sep } = pth.posix;
        return join3(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
      }
      function filenameFilter(filterfn) {
        if (filterfn instanceof RegExp) {
          return /* @__PURE__ */ (function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          })(filterfn);
        } else if ("function" !== typeof filterfn) {
          return () => true;
        }
        return filterfn;
      }
      const relativePath = (local, entry) => {
        let lastChar = entry.slice(-1);
        lastChar = lastChar === filetools.sep ? filetools.sep : "";
        return pth.relative(local, entry) + lastChar;
      };
      return {
        /**
         * Extracts the given entry from the archive and returns the content as a Buffer object
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {Buffer|string} [pass] - password
         * @return Buffer or Null in case of error
         */
        readFile: function(entry, pass) {
          var item = getEntry(entry);
          return item && item.getData(pass) || null;
        },
        /**
         * Returns how many child elements has on entry (directories) on files it is always 0
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @returns {integer}
         */
        childCount: function(entry) {
          const item = getEntry(entry);
          if (item) {
            return _zip.getChildCount(item);
          }
        },
        /**
         * Asynchronous readFile
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         *
         * @return Buffer or Null in case of error
         */
        readFileAsync: function(entry, callback) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(callback);
          } else {
            callback(null, "getEntry failed for:" + entry);
          }
        },
        /**
         * Extracts the given entry from the archive and returns the content as plain text in the given encoding
         * @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
         * @param {string} encoding - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsText: function(entry, encoding) {
          var item = getEntry(entry);
          if (item) {
            var data = item.getData();
            if (data && data.length) {
              return data.toString(encoding || "utf8");
            }
          }
          return "";
        },
        /**
         * Asynchronous readAsText
         * @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
         * @param {callback} callback
         * @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsTextAsync: function(entry, callback, encoding) {
          var item = getEntry(entry);
          if (item) {
            item.getDataAsync(function(data, err) {
              if (err) {
                callback(data, err);
                return;
              }
              if (data && data.length) {
                callback(data.toString(encoding || "utf8"));
              } else {
                callback("");
              }
            });
          } else {
            callback("");
          }
        },
        /**
         * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
         *
         * @param {ZipEntry|string} entry
         * @param {boolean} withsubfolders
         * @returns {void}
         */
        deleteFile: function(entry, withsubfolders = true) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteFile(item.entryName, withsubfolders);
          }
        },
        /**
         * Remove the entry from the file or directory without affecting any nested entries
         *
         * @param {ZipEntry|string} entry
         * @returns {void}
         */
        deleteEntry: function(entry) {
          var item = getEntry(entry);
          if (item) {
            _zip.deleteEntry(item.entryName);
          }
        },
        /**
         * Adds a comment to the zip. The zip must be rewritten after adding the comment.
         *
         * @param {string} comment
         */
        addZipComment: function(comment) {
          _zip.comment = comment;
        },
        /**
         * Returns the zip comment
         *
         * @return String
         */
        getZipComment: function() {
          return _zip.comment || "";
        },
        /**
         * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
         * The comment cannot exceed 65535 characters in length
         *
         * @param {ZipEntry} entry
         * @param {string} comment
         */
        addZipEntryComment: function(entry, comment) {
          var item = getEntry(entry);
          if (item) {
            item.comment = comment;
          }
        },
        /**
         * Returns the comment of the specified entry
         *
         * @param {ZipEntry} entry
         * @return String
         */
        getZipEntryComment: function(entry) {
          var item = getEntry(entry);
          if (item) {
            return item.comment || "";
          }
          return "";
        },
        /**
         * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
         *
         * @param {ZipEntry} entry
         * @param {Buffer} content
         */
        updateFile: function(entry, content) {
          var item = getEntry(entry);
          if (item) {
            item.setData(content);
          }
        },
        /**
         * Adds a file from the disk to the archive
         *
         * @param {string} localPath File to add to zip
         * @param {string} [zipPath] Optional path inside the zip
         * @param {string} [zipName] Optional name for the file
         * @param {string} [comment] Optional file comment
         */
        addLocalFile: function(localPath, zipPath, zipName, comment) {
          if (filetools.fs.existsSync(localPath)) {
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            const _attr = filetools.fs.statSync(localPath);
            const data = _attr.isFile() ? filetools.fs.readFileSync(localPath) : Buffer.alloc(0);
            if (_attr.isDirectory()) zipPath += filetools.sep;
            this.addFile(zipPath, data, comment, _attr);
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Callback for showing if everything was done.
         *
         * @callback doneCallback
         * @param {Error} err - Error object
         * @param {boolean} done - was request fully completed
         */
        /**
         * Adds a file from the disk to the archive
         *
         * @param {(object|string)} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the file.
         * @param {string} [options.comment] - Optional file comment.
         * @param {string} [options.zipPath] - Optional path inside the zip
         * @param {string} [options.zipName] - Optional name for the file
         * @param {doneCallback} callback - The callback that handles the response.
         */
        addLocalFileAsync: function(options2, callback) {
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(options2.localPath);
          const { comment } = options2;
          let { zipPath, zipName } = options2;
          const self2 = this;
          filetools.fs.stat(localPath, function(err, stats) {
            if (err) return callback(err, false);
            zipPath = zipPath ? fixPath(zipPath) : "";
            const p = pth.win32.basename(pth.win32.normalize(localPath));
            zipPath += zipName ? zipName : p;
            if (stats.isFile()) {
              filetools.fs.readFile(localPath, function(err2, data) {
                if (err2) return callback(err2, false);
                self2.addFile(zipPath, data, comment, stats);
                return setImmediate(callback, void 0, true);
              });
            } else if (stats.isDirectory()) {
              zipPath += filetools.sep;
              self2.addFile(zipPath, Buffer.alloc(0), comment, stats);
              return setImmediate(callback, void 0, true);
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - local path to the folder
         * @param {string} [zipPath] - optional path inside zip
         * @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
         */
        addLocalFolder: function(localPath, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          if (filetools.fs.existsSync(localPath)) {
            const items = filetools.findFiles(localPath);
            const self2 = this;
            if (items.length) {
              for (const filepath of items) {
                const p = pth.join(zipPath, relativePath(localPath, filepath));
                if (filter(p)) {
                  self2.addLocalFile(filepath, pth.dirname(p));
                }
              }
            }
          } else {
            throw Utils.Errors.FILE_NOT_FOUND(localPath);
          }
        },
        /**
         * Asynchronous addLocalFolder
         * @param {string} localPath
         * @param {callback} callback
         * @param {string} [zipPath] optional path inside zip
         * @param {RegExp|function} [filter] optional RegExp or Function if files match will
         *               be included.
         */
        addLocalFolderAsync: function(localPath, callback, zipPath, filter) {
          filter = filenameFilter(filter);
          zipPath = zipPath ? fixPath(zipPath) : "";
          localPath = pth.normalize(localPath);
          var self2 = this;
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
            } else if (err) {
              callback(void 0, err);
            } else {
              var items = filetools.findFiles(localPath);
              var i = -1;
              var next = function() {
                i += 1;
                if (i < items.length) {
                  var filepath = items[i];
                  var p = relativePath(localPath, filepath).split("\\").join("/");
                  p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                  if (filter(p)) {
                    filetools.fs.stat(filepath, function(er0, stats) {
                      if (er0) callback(void 0, er0);
                      if (stats.isFile()) {
                        filetools.fs.readFile(filepath, function(er1, data) {
                          if (er1) {
                            callback(void 0, er1);
                          } else {
                            self2.addFile(zipPath + p, data, "", stats);
                            next();
                          }
                        });
                      } else {
                        self2.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
                        next();
                      }
                    });
                  } else {
                    process.nextTick(() => {
                      next();
                    });
                  }
                } else {
                  callback(true, void 0);
                }
              };
              next();
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {object | string} options - options object, if it is string it us used as localPath.
         * @param {string} options.localPath - Local path to the folder.
         * @param {string} [options.zipPath] - optional path inside zip.
         * @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [options.namefix] - optional function to help fix filename
         * @param {doneCallback} callback - The callback that handles the response.
         *
         */
        addLocalFolderAsync2: function(options2, callback) {
          const self2 = this;
          options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
          const localPath = pth.resolve(fixPath(options2.localPath));
          let { zipPath, filter, namefix } = options2;
          if (filter instanceof RegExp) {
            filter = /* @__PURE__ */ (function(rx) {
              return function(filename) {
                return rx.test(filename);
              };
            })(filter);
          } else if ("function" !== typeof filter) {
            filter = function() {
              return true;
            };
          }
          zipPath = zipPath ? fixPath(zipPath) : "";
          if (namefix === "latin1") {
            namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
          }
          if (typeof namefix !== "function") namefix = (str) => str;
          const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
          const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
          filetools.fs.open(localPath, "r", function(err) {
            if (err && err.code === "ENOENT") {
              callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
            } else if (err) {
              callback(void 0, err);
            } else {
              filetools.findFilesAsync(localPath, function(err2, fileEntries) {
                if (err2) return callback(err2);
                fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
                if (!fileEntries.length) callback(void 0, false);
                setImmediate(
                  fileEntries.reverse().reduce(function(next, entry) {
                    return function(err3, done) {
                      if (err3 || done === false) return setImmediate(next, err3, false);
                      self2.addLocalFileAsync(
                        {
                          localPath: entry,
                          zipPath: pth.dirname(relPathFix(entry)),
                          zipName: fileNameFix(entry)
                        },
                        next
                      );
                    };
                  }, callback)
                );
              });
            }
          });
        },
        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param {string} localPath - path where files will be extracted
         * @param {object} props - optional properties
         * @param {string} [props.zipPath] - optional path inside zip
         * @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
         * @param {function|string} [props.namefix] - optional function to help fix filename
         */
        addLocalFolderPromise: function(localPath, props) {
          return new Promise((resolve, reject) => {
            this.addLocalFolderAsync2(Object.assign({ localPath }, props), (err, done) => {
              if (err) reject(err);
              if (done) resolve(this);
            });
          });
        },
        /**
         * Allows you to create a entry (file or directory) in the zip file.
         * If you want to create a directory the entryName must end in / and a null buffer should be provided.
         * Comment and attributes are optional
         *
         * @param {string} entryName
         * @param {Buffer | string} content - file content as buffer or utf8 coded string
         * @param {string} [comment] - file comment
         * @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
         */
        addFile: function(entryName, content, comment, attr) {
          entryName = zipnamefix(entryName);
          let entry = getEntry(entryName);
          const update = entry != null;
          if (!update) {
            entry = new ZipEntry(opts);
            entry.entryName = entryName;
          }
          entry.comment = comment || "";
          const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
          if (isStat) {
            entry.header.time = attr.mtime;
          }
          var fileattr = entry.isDirectory ? 16 : 0;
          let unix = entry.isDirectory ? 16384 : 32768;
          if (isStat) {
            unix |= 4095 & attr.mode;
          } else if ("number" === typeof attr) {
            unix |= 4095 & attr;
          } else {
            unix |= entry.isDirectory ? 493 : 420;
          }
          fileattr = (fileattr | unix << 16) >>> 0;
          entry.attr = fileattr;
          entry.setData(content);
          if (!update) _zip.setEntry(entry);
          return entry;
        },
        /**
         * Returns an array of ZipEntry objects representing the files and folders inside the archive
         *
         * @param {string} [password]
         * @returns Array
         */
        getEntries: function(password) {
          _zip.password = password;
          return _zip ? _zip.entries : [];
        },
        /**
         * Returns a ZipEntry object representing the file or folder specified by ``name``.
         *
         * @param {string} name
         * @return ZipEntry
         */
        getEntry: function(name) {
          return getEntry(name);
        },
        getEntryCount: function() {
          return _zip.getEntryCount();
        },
        forEach: function(callback) {
          return _zip.forEach(callback);
        },
        /**
         * Extracts the given entry to the given targetPath
         * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
         *
         * @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
         * @param {string} targetPath - Target folder where to write the file
         * @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
         * @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
         * @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
         * @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
         *
         * @return Boolean
         */
        extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
          overwrite = get_Bool(false, overwrite);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          maintainEntryPath = get_Bool(true, maintainEntryPath);
          outFileName = get_Str(keepOriginalPermission, outFileName);
          var item = getEntry(entry);
          if (!item) {
            throw Utils.Errors.NO_ENTRY();
          }
          var entryName = canonical(item.entryName);
          var target = sanitize(targetPath, outFileName && !item.isDirectory ? canonical(outFileName) : maintainEntryPath ? entryName : pth.basename(entryName));
          if (item.isDirectory) {
            var children = _zip.getEntryChildren(item);
            children.forEach(function(child) {
              if (child.isDirectory) return;
              var content2 = child.getData();
              if (!content2) {
                throw Utils.Errors.CANT_EXTRACT_FILE();
              }
              var name = canonical(maintainEntryPath ? child.entryName : child.entryName.substring(item.entryName.length));
              var childName = sanitize(targetPath, name);
              const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : void 0;
              filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
            });
            return true;
          }
          var content = item.getData(_zip.password);
          if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
          if (filetools.fs.existsSync(target) && !overwrite) {
            throw Utils.Errors.CANT_OVERRIDE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
          filetools.writeFileTo(target, content, overwrite, fileAttr);
          return true;
        },
        /**
         * Test the archive
         * @param {string} [pass]
         */
        test: function(pass) {
          if (!_zip) {
            return false;
          }
          for (var entry of _zip.entries) {
            try {
              if (entry.isDirectory) {
                continue;
              }
              var content = entry.getData(pass);
              if (!content) {
                return false;
              }
            } catch (err) {
              return false;
            }
          }
          return true;
        },
        /**
         * Extracts the entire archive to the given location
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {string|Buffer} [pass] password
         */
        extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          pass = get_Str(keepOriginalPermission, pass);
          overwrite = get_Bool(false, overwrite);
          if (!_zip) throw Utils.Errors.NO_ZIP();
          const dirEntries = [];
          _zip.entries.forEach(function(entry) {
            var entryName = sanitize(targetPath, canonical(entry.entryName));
            if (entry.isDirectory) {
              filetools.makeDir(entryName);
              if (keepOriginalPermission) dirEntries.push({ path: entryName, attr: entry.header.fileAttr });
              return;
            }
            var content = entry.getData(pass);
            if (!content) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            filetools.writeFileTo(entryName, content, overwrite, fileAttr);
            try {
              filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
            } catch (err) {
            }
          });
          applyDirAttributes(dirEntries);
        },
        /**
         * Asynchronous extractAllTo
         *
         * @param {string} targetPath Target location
         * @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
         *                  Default is FALSE
         * @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
         */
        extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
          callback = get_Fun(overwrite, keepOriginalPermission, callback);
          keepOriginalPermission = get_Bool(false, keepOriginalPermission);
          overwrite = get_Bool(false, overwrite);
          if (!callback) {
            return new Promise((resolve, reject) => {
              this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(this);
                }
              });
            });
          }
          if (!_zip) {
            callback(Utils.Errors.NO_ZIP());
            return;
          }
          targetPath = pth.resolve(targetPath);
          const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
          const getError = (msg, file) => new Error(msg + ': "' + file + '"');
          const dirEntries = [];
          const fileEntries = [];
          _zip.entries.forEach((e) => {
            if (e.isDirectory) {
              dirEntries.push(e);
            } else {
              fileEntries.push(e);
            }
          });
          const deferredDirAttr = [];
          for (const entry of dirEntries) {
            const dirPath = getPath(entry);
            const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
            try {
              filetools.makeDir(dirPath);
            } catch (er) {
              callback(getError("Unable to create folder", dirPath));
              continue;
            }
            if (dirAttr) deferredDirAttr.push({ path: dirPath, attr: dirAttr });
            try {
              filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
            } catch (er) {
            }
          }
          const done = (err) => {
            if (!err) {
              try {
                applyDirAttributes(deferredDirAttr);
              } catch (er) {
                return callback(getError("Unable to set folder permissions", er.path || ""));
              }
            }
            callback(err);
          };
          fileEntries.reverse().reduce(function(next, entry) {
            return function(err) {
              if (err) {
                next(err);
              } else {
                const entryName = pth.normalize(canonical(entry.entryName));
                const filePath = sanitize(targetPath, entryName);
                entry.getDataAsync(function(content, err_1) {
                  if (err_1) {
                    next(err_1);
                  } else if (!content) {
                    next(Utils.Errors.CANT_EXTRACT_FILE());
                  } else {
                    const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
                    filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                      if (!succ) {
                        return next(getError("Unable to write file", filePath));
                      }
                      filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function() {
                        next();
                      });
                    });
                  }
                });
              }
            };
          }, done)();
        },
        /**
         * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
         *
         * @param {string} targetFileName
         * @param {function} callback
         */
        writeZip: function(targetFileName, callback) {
          if (arguments.length === 1) {
            if (typeof targetFileName === "function") {
              callback = targetFileName;
              targetFileName = "";
            }
          }
          if (!targetFileName && opts.filename) {
            targetFileName = opts.filename;
          }
          if (!targetFileName) return;
          var zipData = _zip.compressToBuffer();
          if (zipData) {
            var ok = filetools.writeFileTo(targetFileName, zipData, true);
            if (typeof callback === "function") callback(!ok ? new Error("failed") : null, "");
          }
        },
        /**
                 *
                 * @param {string} targetFileName
                 * @param {object} [props]
                 * @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
                 * @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
        
                 * @returns {Promise<void>}
                 */
        writeZipPromise: function(targetFileName, props) {
          const { overwrite, perm } = Object.assign({ overwrite: true }, props);
          return new Promise((resolve, reject) => {
            if (!targetFileName && opts.filename) targetFileName = opts.filename;
            if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
            this.toBufferPromise().then((zipData) => {
              const ret = (done) => done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file");
              filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
            }, reject);
          });
        },
        /**
         * @returns {Promise<Buffer>} A promise to the Buffer.
         */
        toBufferPromise: function() {
          return new Promise((resolve, reject) => {
            _zip.toAsyncBuffer(resolve, reject);
          });
        },
        /**
         * Returns the content of the entire zip file as a Buffer object
         *
         * @prop {function} [onSuccess]
         * @prop {function} [onFail]
         * @prop {function} [onItemStart]
         * @prop {function} [onItemEnd]
         * @returns {Buffer}
         */
        toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
          if (typeof onSuccess === "function") {
            _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
            return null;
          }
          return _zip.compressToBuffer();
        }
      };
    };
  }
});

// api/_handler.ts
var handler_exports = {};
__export(handler_exports, {
  default: () => handler
});
module.exports = __toCommonJS(handler_exports);

// server/providers/http.ts
function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}
function readRouteUrl(request) {
  return new URL(request.url ?? "/", "http://atlasops.local");
}

// server/transport/historyStore.ts
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
var observationFileName = "vehicle-observations.jsonl";
var predictionFileName = "eta-predictions.jsonl";
var stopArrivalFileName = "observed-stop-arrivals.jsonl";
var journeySegmentFileName = "journey-segments.jsonl";
var defaultLimit = 500;
var maxLimit = 5e3;
var recentObservationKeys = /* @__PURE__ */ new Map();
var previousObservationByVehicleId = /* @__PURE__ */ new Map();
var previousArrivalByTripVehicle = /* @__PURE__ */ new Map();
var writeQueue = Promise.resolve();
async function recordVehicleSnapshot(collection, source, recordedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const records = collection.features.flatMap((feature) => {
    const [longitude, latitude] = feature.geometry.coordinates;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];
    const vehicleId = feature.properties.vehicleId ?? feature.properties.id;
    const duplicateKey = [
      feature.properties.observedAt,
      longitude.toFixed(6),
      latitude.toFixed(6),
      feature.properties.tripId ?? "",
      feature.properties.routeId ?? ""
    ].join("|");
    if (recentObservationKeys.get(vehicleId) === duplicateKey) return [];
    recentObservationKeys.set(vehicleId, duplicateKey);
    return [{
      observationId: `${feature.properties.provider}:${vehicleId}:${feature.properties.observedAt}`,
      provider: feature.properties.provider,
      source,
      vehicleId,
      featureId: feature.properties.id,
      tripId: feature.properties.tripId,
      routeId: feature.properties.routeId,
      routeLabel: feature.properties.routeLabel,
      longitude,
      latitude,
      bearing: feature.properties.bearing,
      speed: feature.properties.speed,
      observedAt: feature.properties.observedAt,
      recordedAt,
      scheduleStatus: feature.properties.scheduleStatus,
      scheduleDeviationSeconds: feature.properties.scheduleDeviationSeconds,
      nextStopId: stringValue(feature.properties.sourceProperties.nextStopId),
      currentStopSequence: numberValue(feature.properties.sourceProperties.currentStopSequence),
      scheduleRelationship: stringValue(feature.properties.sourceProperties.scheduleRelationship),
      providerArrival: stringValue(feature.properties.sourceProperties.providerArrival)
    }];
  });
  await appendJsonl(observationPath(), records);
  const derived = deriveStopArrivals(records, recordedAt);
  await appendJsonl(stopArrivalPath(), derived.arrivals);
  await appendJsonl(journeySegmentPath(), derived.segments);
  return {
    recordedObservationCount: records.length,
    recordedStopArrivalCount: derived.arrivals.length,
    recordedJourneySegmentCount: derived.segments.length,
    recordedAt
  };
}
async function recordEtaPrediction(prediction, predictorVersion = "baseline-v1") {
  const record = {
    predictionId: crypto.randomUUID(),
    predictorVersion,
    status: prediction.status,
    method: prediction.method,
    confidence: prediction.confidence,
    createdAt: prediction.calculatedAt,
    vehicleId: prediction.vehicleId,
    tripId: prediction.tripId,
    routeId: prediction.routeId,
    targetStopId: prediction.stopId,
    predictedArrival: prediction.predictedArrival,
    scheduledArrival: prediction.scheduledArrival,
    providerArrival: prediction.providerArrival,
    estimatedTravelSeconds: prediction.estimatedTravelSeconds,
    distanceRemainingMeters: prediction.distanceRemainingMeters,
    scheduleDeviationSeconds: prediction.scheduleDeviationSeconds,
    evidence: prediction.evidence
  };
  await appendJsonl(predictionPath(), [record]);
  return record;
}
async function vehicleObservations(query = {}) {
  return filterByTimeAndLimit(await readJsonl(observationPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId || record.featureId === query.vehicleId) && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId) && (!query.tripId || record.tripId === query.tripId);
  }, (record) => record.observedAt);
}
async function etaPredictions(query = {}) {
  return filterByTimeAndLimit(await readJsonl(predictionPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId) && (!query.routeId || record.routeId === query.routeId) && (!query.tripId || record.tripId === query.tripId) && (!query.targetStopId || record.targetStopId === query.targetStopId);
  }, (record) => record.createdAt);
}
async function observedStopArrivals(query = {}) {
  return filterByTimeAndLimit(await readJsonl(stopArrivalPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId || record.featureId === query.vehicleId) && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId) && (!query.tripId || record.tripId === query.tripId) && (!query.stopId || record.stopId === query.stopId);
  }, (record) => record.observedArrival);
}
async function journeySegments(query = {}) {
  return filterByTimeAndLimit(await readJsonl(journeySegmentPath()), query, (record) => {
    return (!query.vehicleId || record.vehicleId === query.vehicleId) && (!query.routeId || record.routeId === query.routeId || record.routeLabel === query.routeId) && (!query.tripId || record.tripId === query.tripId) && (!query.fromStopId || record.fromStopId === query.fromStopId) && (!query.toStopId || record.toStopId === query.toStopId);
  }, (record) => record.arrivedAt);
}
async function vehicleObservationSummary(query = {}) {
  const records = await vehicleObservations({ ...query, limit: maxLimit });
  const vehicles = new Set(records.map((record) => record.vehicleId));
  const routes = new Set(records.flatMap((record) => record.routeId ? [record.routeId] : []));
  const trips = new Set(records.flatMap((record) => record.tripId ? [record.tripId] : []));
  const delays = records.flatMap((record) => typeof record.scheduleDeviationSeconds === "number" ? [record.scheduleDeviationSeconds] : []);
  return {
    observationCount: records.length,
    vehicleCount: vehicles.size,
    routeCount: routes.size,
    tripCount: trips.size,
    firstObservedAt: records.at(0)?.observedAt,
    lastObservedAt: records.at(-1)?.observedAt,
    averageScheduleDeviationSeconds: delays.length ? Math.round(delays.reduce((total, value) => total + value, 0) / delays.length) : void 0
  };
}
async function stopArrivalSummary(query = {}) {
  const records = await observedStopArrivals({ ...query, limit: maxLimit });
  const vehicles = new Set(records.map((record) => record.vehicleId));
  const routes = new Set(records.flatMap((record) => record.routeId ? [record.routeId] : []));
  const trips = new Set(records.map((record) => record.tripId));
  const stops = new Set(records.map((record) => record.stopId));
  const deviations = records.flatMap((record) => typeof record.scheduleDeviationSeconds === "number" ? [record.scheduleDeviationSeconds] : []);
  return {
    arrivalCount: records.length,
    vehicleCount: vehicles.size,
    routeCount: routes.size,
    tripCount: trips.size,
    stopCount: stops.size,
    firstObservedArrival: records.at(0)?.observedArrival,
    lastObservedArrival: records.at(-1)?.observedArrival,
    averageScheduleDeviationSeconds: deviations.length ? Math.round(deviations.reduce((total, value) => total + value, 0) / deviations.length) : void 0
  };
}
async function journeySegmentSummary(query = {}) {
  const records = await journeySegments({ ...query, limit: maxLimit });
  const durations = records.map((record) => record.durationSeconds).filter(Number.isFinite);
  return {
    segmentCount: records.length,
    firstArrivedAt: records.at(0)?.arrivedAt,
    lastArrivedAt: records.at(-1)?.arrivedAt,
    medianDurationSeconds: median(durations),
    p10DurationSeconds: percentile(durations, 0.1),
    p90DurationSeconds: percentile(durations, 0.9)
  };
}
function deriveStopArrivals(records, recordedAt) {
  const arrivals = [];
  const segments = [];
  for (const current of [...records].sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt))) {
    const previous = previousObservationByVehicleId.get(current.vehicleId);
    previousObservationByVehicleId.set(current.vehicleId, current);
    if (!previous || !previous.tripId || !current.tripId || previous.tripId !== current.tripId) continue;
    if (!previous.nextStopId || previous.nextStopId === current.nextStopId) continue;
    const sequenceAdvanced = previous.currentStopSequence === void 0 || current.currentStopSequence === void 0 || current.currentStopSequence >= previous.currentStopSequence;
    if (!sequenceAdvanced) continue;
    const observedArrival = current.observedAt;
    const arrival = {
      arrivalId: `${current.vehicleId}:${current.tripId}:${previous.nextStopId}:${observedArrival}`,
      source: "next-stop-transition",
      vehicleId: current.vehicleId,
      featureId: current.featureId,
      tripId: current.tripId,
      routeId: current.routeId ?? previous.routeId,
      routeLabel: current.routeLabel ?? previous.routeLabel,
      stopId: previous.nextStopId,
      stopSequence: previous.currentStopSequence,
      scheduledArrival: scheduledArrivalFromDeviation(observedArrival, previous.scheduleDeviationSeconds),
      providerPredictedArrival: previous.providerArrival,
      observedArrival,
      recordedAt,
      scheduleDeviationSeconds: previous.scheduleDeviationSeconds,
      confidence: previous.currentStopSequence !== void 0 && current.currentStopSequence !== void 0 ? "medium" : "low"
    };
    arrivals.push(arrival);
    const previousArrivalKey = `${arrival.vehicleId}:${arrival.tripId}`;
    const previousArrival = previousArrivalByTripVehicle.get(previousArrivalKey);
    previousArrivalByTripVehicle.set(previousArrivalKey, arrival);
    const segment = previousArrival ? journeySegmentFromArrivals(previousArrival, arrival, recordedAt) : void 0;
    if (segment) segments.push(segment);
  }
  return { arrivals, segments };
}
function journeySegmentFromArrivals(from, to, recordedAt) {
  if (from.stopId === to.stopId) return void 0;
  if (from.stopSequence !== void 0 && to.stopSequence !== void 0 && to.stopSequence <= from.stopSequence) return void 0;
  const durationSeconds = Math.round((Date.parse(to.observedArrival) - Date.parse(from.observedArrival)) / 1e3);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 3 * 3600) return void 0;
  return {
    segmentId: `${to.vehicleId}:${to.tripId}:${from.stopId}:${to.stopId}:${to.observedArrival}`,
    vehicleId: to.vehicleId,
    tripId: to.tripId,
    routeId: to.routeId ?? from.routeId,
    routeLabel: to.routeLabel ?? from.routeLabel,
    fromStopId: from.stopId,
    toStopId: to.stopId,
    fromStopSequence: from.stopSequence,
    toStopSequence: to.stopSequence,
    departedAt: from.observedArrival,
    arrivedAt: to.observedArrival,
    durationSeconds,
    recordedAt,
    scheduleDeviationSeconds: to.scheduleDeviationSeconds
  };
}
function filterByTimeAndLimit(records, query, predicate, timestamp) {
  const sinceMs = query.since ? Date.parse(query.since) : Number.NEGATIVE_INFINITY;
  const untilMs = query.until ? Date.parse(query.until) : Number.POSITIVE_INFINITY;
  const limit = Math.max(1, Math.min(maxLimit, query.limit ?? defaultLimit));
  return records.filter((record) => {
    const time = Date.parse(timestamp(record));
    return Number.isFinite(time) && time >= sinceMs && time <= untilMs && predicate(record);
  }).sort((left, right) => Date.parse(timestamp(left)) - Date.parse(timestamp(right))).slice(-limit);
}
function appendJsonl(path, records) {
  if (!records.length) return Promise.resolve();
  writeQueue = writeQueue.then(async () => {
    await (0, import_promises.mkdir)(dataDirectory(), { recursive: true });
    await (0, import_promises.writeFile)(path, `${records.map((record) => JSON.stringify(record)).join("\n")}
`, { flag: "a" });
  });
  return writeQueue;
}
async function readJsonl(path) {
  try {
    const text = await (0, import_promises.readFile)(path, "utf8");
    return text.split(/\r?\n/).flatMap((line) => {
      if (!line.trim()) return [];
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}
function dataDirectory() {
  return process.env.ATLASOPS_DATA_DIR?.trim() || (0, import_node_path.join)(process.cwd(), ".atlasops-data");
}
function observationPath() {
  return (0, import_node_path.join)(dataDirectory(), observationFileName);
}
function predictionPath() {
  return (0, import_node_path.join)(dataDirectory(), predictionFileName);
}
function stopArrivalPath() {
  return (0, import_node_path.join)(dataDirectory(), stopArrivalFileName);
}
function journeySegmentPath() {
  return (0, import_node_path.join)(dataDirectory(), journeySegmentFileName);
}
function scheduledArrivalFromDeviation(observedArrival, deviationSeconds) {
  if (deviationSeconds === void 0) return void 0;
  return new Date(Date.parse(observedArrival) - deviationSeconds * 1e3).toISOString();
}
function stringValue(value) {
  return typeof value === "string" && value ? value : void 0;
}
function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function median(values) {
  return percentile(values, 0.5);
}
function percentile(values, ratio) {
  if (!values.length) return void 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * ratio)));
  return sorted[index];
}

// server/transport/routes.ts
function transportRoutes() {
  return async (request, response, next) => {
    const url = readRouteUrl(request);
    if (url.pathname === "/api/transport/vehicle-observations") {
      try {
        sendJson(response, 200, {
          observations: await vehicleObservations(vehicleQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Vehicle observation history request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/vehicle-observations/summary") {
      try {
        sendJson(response, 200, {
          summary: await vehicleObservationSummary(vehicleQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Vehicle observation summary request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/eta-predictions" && request.method === "GET") {
      try {
        sendJson(response, 200, {
          predictions: await etaPredictions(predictionQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "ETA prediction history request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/stop-arrivals") {
      try {
        sendJson(response, 200, {
          arrivals: await observedStopArrivals(stopArrivalQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Observed stop arrival request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/stop-arrivals/summary") {
      try {
        sendJson(response, 200, {
          summary: await stopArrivalSummary(stopArrivalQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Observed stop arrival summary request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/journey-segments") {
      try {
        sendJson(response, 200, {
          segments: await journeySegments(journeySegmentQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Journey segment request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/journey-segments/summary") {
      try {
        sendJson(response, 200, {
          summary: await journeySegmentSummary(journeySegmentQuery(url)),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "Journey segment summary request failed" });
      }
      return;
    }
    if (url.pathname === "/api/transport/eta-predictions" && request.method === "POST") {
      try {
        const body = await readJsonBody(request);
        if (!isRecord(body) || !isEtaPrediction(body.prediction)) {
          sendJson(response, 400, { error: "prediction is required" });
          return;
        }
        const record = await recordEtaPrediction(body.prediction, stringValue2(body.predictorVersion) ?? "baseline-v1");
        sendJson(response, 201, { record });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "ETA prediction record request failed" });
      }
      return;
    }
    next();
  };
}
function vehicleQuery(url) {
  return {
    vehicleId: optionalParam(url, "vehicleId"),
    routeId: optionalParam(url, "routeId"),
    tripId: optionalParam(url, "tripId"),
    since: optionalParam(url, "since"),
    until: optionalParam(url, "until"),
    limit: numberParam(url, "limit")
  };
}
function predictionQuery(url) {
  return {
    ...vehicleQuery(url),
    targetStopId: optionalParam(url, "targetStopId")
  };
}
function stopArrivalQuery(url) {
  return {
    ...vehicleQuery(url),
    stopId: optionalParam(url, "stopId")
  };
}
function journeySegmentQuery(url) {
  return {
    ...vehicleQuery(url),
    fromStopId: optionalParam(url, "fromStopId"),
    toStopId: optionalParam(url, "toStopId")
  };
}
function optionalParam(url, key) {
  return url.searchParams.get(key)?.trim() || void 0;
}
function numberParam(url, key) {
  const value = Number(url.searchParams.get(key));
  return Number.isFinite(value) ? value : void 0;
}
function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : void 0);
      } catch {
        reject(new Error("Request body is not valid JSON"));
      }
    });
    request.on("error", reject);
  });
}
function stringValue2(value) {
  return typeof value === "string" && value ? value : void 0;
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function isEtaPrediction(value) {
  return isRecord(value) && typeof value.status === "string" && typeof value.vehicleId === "string" && typeof value.confidence === "string" && typeof value.calculatedAt === "string" && typeof value.method === "string" && isRecord(value.evidence);
}

// server/providers/ntaGtfsRealtime/adapter.ts
function adaptNtaVehicles(vehicles, source) {
  const features = vehicles.flatMap((vehicle) => {
    if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) return [];
    const observedAt = vehicle.timestamp ? new Date(vehicle.timestamp * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const id = `nta-gtfs-realtime:${vehicle.vehicleId ?? vehicle.id}`;
    const routeLabel = vehicle.routeShortName ?? vehicle.routeId ?? vehicle.label;
    return [{
      type: "Feature",
      id,
      geometry: { type: "Point", coordinates: [vehicle.longitude, vehicle.latitude] },
      properties: {
        id,
        provider: "nta-gtfs-realtime",
        providerName: "NTA GTFS-Realtime",
        assetType: classifyVehicle(routeLabel, vehicle.routeType),
        name: routeLabel ? `Route ${routeLabel}` : `Vehicle ${vehicle.vehicleId ?? vehicle.id}`,
        routeId: vehicle.routeId,
        routeLabel,
        tripId: vehicle.tripId,
        vehicleId: vehicle.vehicleId,
        bearing: vehicle.bearing,
        speed: vehicle.speed,
        scheduleStatus: vehicle.scheduleStatus,
        scheduleDeviationSeconds: vehicle.scheduleDeviationSeconds,
        nextStopName: vehicle.nextStopName,
        observedAt,
        status: source === "fixture" ? "unknown" : "normal",
        interpolated: false,
        sourceProperties: {
          source,
          staticGtfsSource: vehicle.staticGtfsSource,
          feedEntityId: vehicle.id,
          routeShortName: vehicle.routeShortName,
          routeLongName: vehicle.routeLongName,
          agencyName: vehicle.agencyName,
          tripHeadsign: vehicle.tripHeadsign,
          directionId: vehicle.directionId,
          startDate: vehicle.startDate,
          startTime: vehicle.startTime,
          stopId: vehicle.stopId,
          currentStopSequence: vehicle.currentStopSequence,
          label: vehicle.label,
          licensePlate: vehicle.licensePlate,
          currentStatus: vehicle.currentStatus,
          congestionLevel: vehicle.congestionLevel,
          occupancyStatus: vehicle.occupancyStatus,
          scheduleSource: vehicle.scheduleSource,
          providerArrival: vehicle.providerArrival,
          nextStopId: vehicle.nextStopId
        }
      }
    }];
  });
  return { type: "FeatureCollection", features };
}
function classifyVehicle(routeLabel, routeType) {
  if (routeType !== void 0) {
    if (routeType === "3" || Number(routeType) >= 700 && Number(routeType) < 800) return "bus";
    if (routeType === "0" || Number(routeType) >= 900 && Number(routeType) < 1e3) return "tram";
    if (routeType === "2" || Number(routeType) >= 100 && Number(routeType) < 200) return "rail";
    return "vehicle";
  }
  const route = routeLabel?.toLowerCase() ?? "";
  if (route.includes("luas")) return "tram";
  if (route.includes("rail") || route.includes("dart")) return "rail";
  if (route) return "bus";
  return "vehicle";
}

// server/providers/ntaGtfsRealtime/alertsAdapter.ts
function adaptNtaServiceAlerts(alerts, source) {
  const features = alerts.map((alert) => {
    const activePeriod = currentOrFirstPeriod(alert.activePeriods);
    const startedAt = activePeriod.start ? new Date(activePeriod.start * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
    const endedAt = activePeriod.end ? new Date(activePeriod.end * 1e3).toISOString() : void 0;
    const id = `nta-gtfs-realtime:alert:${alert.id}`;
    const coordinates = alert.latitude !== void 0 && alert.longitude !== void 0 ? [alert.longitude, alert.latitude] : [-6.2603, 53.3498];
    return {
      type: "Feature",
      id,
      geometry: { type: "Point", coordinates },
      properties: {
        id,
        provider: "nta-gtfs-realtime",
        providerName: "NTA GTFS-Realtime",
        source: source === "live" ? "provider" : "atlas",
        type: "service-alert",
        severity: severityForEffect(alert.effect),
        status: endedAt && Date.parse(endedAt) < Date.now() ? "resolved" : "active",
        title: alert.header ?? `Transport service alert ${alert.id}`,
        description: alert.description,
        startedAt,
        endedAt,
        lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        relatedAssetIds: relatedAssets(alert),
        sourceProperties: {
          source,
          cause: alert.cause,
          effect: alert.effect,
          url: alert.url,
          routeIds: alert.routeIds,
          stopIds: alert.stopIds,
          tripIds: alert.tripIds,
          stopName: alert.stopName,
          staticGtfsSource: alert.staticGtfsSource,
          geometrySource: alert.latitude !== void 0 && alert.longitude !== void 0 ? "static-gtfs-stop" : "dublin-centroid"
        }
      }
    };
  });
  return { type: "FeatureCollection", features };
}
function currentOrFirstPeriod(periods) {
  const now = Date.now() / 1e3;
  return periods.find((period) => (period.start ?? 0) <= now && (period.end ?? Number.POSITIVE_INFINITY) >= now) ?? periods[0] ?? {};
}
function severityForEffect(effect) {
  const value = effect?.toLowerCase() ?? "";
  if (value.includes("no_service") || value.includes("stop_moved")) return "critical";
  if (value.includes("significant") || value.includes("detour") || value.includes("reduced")) return "major";
  if (value.includes("delay")) return "minor";
  return "info";
}
function relatedAssets(alert) {
  return [...alert.tripIds, ...alert.routeIds.map((routeId) => `route:${routeId}`)];
}

// server/providers/ntaGtfsRealtime/client.ts
var import_gtfs_realtime_bindings = __toESM(require_gtfs_realtime(), 1);

// server/providers/cache.ts
var cache = /* @__PURE__ */ new Map();
async function cached(key, ttlMs3, loader) {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing?.value !== void 0 && existing.expiresAt > now) return existing.value;
  if (existing?.promise) return existing.promise;
  const promise = loader();
  const entry = {
    expiresAt: now + ttlMs3,
    promise,
    value: existing?.value
  };
  cache.set(key, entry);
  try {
    const value = await promise;
    entry.value = value;
    return value;
  } catch (error) {
    if (existing?.value !== void 0) return existing.value;
    throw error;
  } finally {
    entry.promise = void 0;
  }
}

// server/providers/ntaGtfsRealtime/staticGtfs.ts
var import_node_crypto = require("node:crypto");
var import_promises2 = require("node:fs/promises");
var import_node_path2 = require("node:path");
var import_adm_zip = __toESM(require_adm_zip(), 1);

// node_modules/csv-parse/lib/api/CsvError.js
var CsvError = class _CsvError extends Error {
  constructor(code, message, options, ...contexts) {
    if (Array.isArray(message)) message = message.join(" ").trim();
    super(message);
    if (Error.captureStackTrace !== void 0) {
      Error.captureStackTrace(this, _CsvError);
    }
    this.code = code;
    for (const context of contexts) {
      for (const key in context) {
        const value = context[key];
        this[key] = Buffer.isBuffer(value) ? value.toString(options.encoding) : value == null ? value : JSON.parse(JSON.stringify(value));
      }
    }
  }
};

// node_modules/csv-parse/lib/utils/is_object.js
var is_object = function(obj) {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
};

// node_modules/csv-parse/lib/api/normalize_columns_array.js
var normalize_columns_array = function(columns) {
  const normalizedColumns = [];
  for (let i = 0, l = columns.length; i < l; i++) {
    const column = columns[i];
    if (column === void 0 || column === null || column === false) {
      normalizedColumns[i] = { disabled: true };
    } else if (typeof column === "string" || typeof column === "number") {
      normalizedColumns[i] = { name: `${column}` };
    } else if (is_object(column)) {
      if (typeof column.name !== "string") {
        throw new CsvError("CSV_OPTION_COLUMNS_MISSING_NAME", [
          "Option columns missing name:",
          `property "name" is required at position ${i}`,
          "when column is an object literal"
        ]);
      }
      normalizedColumns[i] = column;
    } else {
      throw new CsvError("CSV_INVALID_COLUMN_DEFINITION", [
        "Invalid column definition:",
        "expect a string or a literal object,",
        `got ${JSON.stringify(column)} at position ${i}`
      ]);
    }
  }
  return normalizedColumns;
};

// node_modules/csv-parse/lib/utils/ResizeableBuffer.js
var ResizeableBuffer = class {
  constructor(size = 100) {
    this.size = size;
    this.length = 0;
    this.buf = Buffer.allocUnsafe(size);
  }
  prepend(val) {
    if (Buffer.isBuffer(val)) {
      const length = this.length + val.length;
      if (length >= this.size) {
        this.resize();
        if (length >= this.size) {
          throw Error("INVALID_BUFFER_STATE");
        }
      }
      const buf = this.buf;
      this.buf = Buffer.allocUnsafe(this.size);
      val.copy(this.buf, 0);
      buf.copy(this.buf, val.length);
      this.length += val.length;
    } else {
      const length = this.length++;
      if (length === this.size) {
        this.resize();
      }
      const buf = this.clone();
      this.buf[0] = val;
      buf.copy(this.buf, 1, 0, length);
    }
  }
  append(val) {
    const length = this.length++;
    if (length === this.size) {
      this.resize();
    }
    this.buf[length] = val;
  }
  clone() {
    return Buffer.from(this.buf.slice(0, this.length));
  }
  resize() {
    const length = this.length;
    this.size = this.size * 2;
    const buf = Buffer.allocUnsafe(this.size);
    this.buf.copy(buf, 0, 0, length);
    this.buf = buf;
  }
  toString(encoding) {
    if (encoding) {
      return this.buf.toString(encoding, 0, this.length);
    } else {
      return Uint8Array.prototype.slice.call(this.buf.slice(0, this.length));
    }
  }
  toJSON() {
    return this.toString("utf8");
  }
  reset() {
    this.length = 0;
  }
};
var ResizeableBuffer_default = ResizeableBuffer;

// node_modules/csv-parse/lib/api/init_state.js
var init_state = function(options) {
  const timchars = [
    // Basic Latin
    32,
    // [Space](https://www.fileformat.info/info/unicode/char/0020/index.htm)
    9,
    // [CHARACTER TABULATION (HT)](https://www.fileformat.info/info/unicode/char/0009/index.htm)
    10,
    // [LINE FEED (LF)](https://www.fileformat.info/info/unicode/char/000a/index.htm)
    13,
    // [CARRIAGE RETURN (CR)](https://www.fileformat.info/info/unicode/char/000d/index.htm)
    12,
    // [FORM FEED (FF)](https://www.fileformat.info/info/unicode/char/000c/index.htm)
    11,
    // [LINE TABULATION (VT)](https://www.fileformat.info/info/unicode/char/000b/index.htm)
    // Latin-1 Supplement
    160,
    // [NO-BREAK SPACE (NBSP)](https://www.fileformat.info/info/unicode/char/00a0/index.htm)
    // Ogham
    5760,
    // [OGHAM SPACE MARK](https://www.fileformat.info/info/unicode/char/1680/index.htm)
    // General Punctuation
    8192,
    // [EN QUAD](https://www.fileformat.info/info/unicode/char/2000/index.htm)
    8193,
    // [EM QUAD](https://www.fileformat.info/info/unicode/char/2001/index.htm)
    8194,
    // [EN SPACE](https://www.fileformat.info/info/unicode/char/2002/index.htm)
    8195,
    // [EM SPACE](https://www.fileformat.info/info/unicode/char/2003/index.htm)
    8196,
    // [THREE-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2004/index.htm)
    8197,
    // [FOUR-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2005/index.htm)
    8198,
    // [SIX-PER-EM SPACE](https://www.fileformat.info/info/unicode/char/2006/index.htm)
    8199,
    // [FIGURE SPACE](https://www.fileformat.info/info/unicode/char/2007/index.htm)
    8200,
    // [PUNCTUATION SPACE](https://www.fileformat.info/info/unicode/char/2008/index.htm)
    8201,
    // [THIN SPACE](https://www.fileformat.info/info/unicode/char/2009/index.htm)
    8202,
    // [HAIR SPACE](https://www.fileformat.info/info/unicode/char/200a/index.htm)
    8232,
    // [LINE SEPARATOR](https://www.fileformat.info/info/unicode/char/2028/index.htm)
    8233,
    // [PARAGRAPH SEPARATOR](https://www.fileformat.info/info/unicode/char/2029/index.htm)
    8239,
    // [NARROW NO-BREAK SPACE (NNBSP)](https://www.fileformat.info/info/unicode/char/202f/index.htm)
    8287,
    // [MEDIUM MATHEMATICAL SPACE (MMSP)](https://www.fileformat.info/info/unicode/char/205f/index.htm)
    12288,
    // [IDEOGRAPHIC SPACE](https://www.fileformat.info/info/unicode/char/3000/index.htm)
    65279
    // [ZERO WIDTH NO-BREAK SPACE (BOM)](https://www.fileformat.info/info/unicode/char/feff/index.htm)
  ].reduce((acc, codepoint) => {
    const encoded = Buffer.from(
      String.fromCharCode(codepoint),
      options.encoding
    );
    if (codepoint !== 63 && encoded.length === 1 && encoded[0] === 63) {
      return acc;
    }
    acc.push(encoded);
    return acc;
  }, []);
  const timcharFirstBytes = new Uint8Array(256);
  for (const t of timchars) timcharFirstBytes[t[0]] = 1;
  return {
    bomSkipped: false,
    bufBytesStart: 0,
    castField: options.cast_function,
    commenting: false,
    delimiterBufPrevious: void 0,
    delimiterDiscovered: false,
    // Current error encountered by a record
    error: void 0,
    enabled: options.from_line === 1,
    escaping: false,
    escapeIsQuote: Buffer.isBuffer(options.escape) && Buffer.isBuffer(options.quote) && Buffer.compare(options.escape, options.quote) === 0,
    // columns can be `false`, `true`, `Array`
    expectedRecordLength: Array.isArray(options.columns) ? options.columns.length : void 0,
    field: new ResizeableBuffer_default(20),
    firstLineToHeaders: options.cast_first_line_to_header,
    needMoreDataSize: Math.max(
      // Skip if the remaining buffer smaller than comment
      options.comment !== null ? options.comment.length : 0,
      ...options.delimiter ? options.delimiter.map((delimiter) => delimiter.length) : [],
      // Auto discovery of delimiter is limited to 1 character
      options.delimiter_auto ? 1 : 0,
      // Skip if the remaining buffer can be escape sequence
      options.quote !== null ? options.quote.length : 0,
      ...timchars.map((t) => t.length)
    ),
    previousBuf: void 0,
    quoting: false,
    stop: false,
    rawBuffer: new ResizeableBuffer_default(100),
    record: [],
    recordHasError: false,
    record_length: 0,
    recordDelimiterMaxLength: options.record_delimiter.length === 0 ? 0 : Math.max(...options.record_delimiter.map((v) => v.length)),
    trimChars: [
      Buffer.from(" ", options.encoding)[0],
      Buffer.from("	", options.encoding)[0]
    ],
    wasQuoting: false,
    wasRowDelimiter: false,
    timchars,
    timcharFirstBytes
  };
};

// node_modules/csv-parse/lib/utils/underscore.js
var underscore = function(str) {
  return str.replace(/([A-Z])/g, function(_, match) {
    return "_" + match.toLowerCase();
  });
};

// node_modules/csv-parse/lib/api/normalize_options.js
var normalize_options = function(opts) {
  const options = {};
  for (const opt in opts) {
    options[underscore(opt)] = opts[opt];
  }
  if (options.encoding === void 0 || options.encoding === true) {
    options.encoding = "utf8";
  } else if (options.encoding === null || options.encoding === false) {
    options.encoding = null;
  } else if (typeof options.encoding !== "string" && options.encoding !== null) {
    throw new CsvError(
      "CSV_INVALID_OPTION_ENCODING",
      [
        "Invalid option encoding:",
        "encoding must be a string or null to return a buffer,",
        `got ${JSON.stringify(options.encoding)}`
      ],
      options
    );
  }
  if (options.bom === void 0 || options.bom === null || options.bom === false) {
    options.bom = false;
  } else if (options.bom !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_BOM",
      [
        "Invalid option bom:",
        "bom must be true,",
        `got ${JSON.stringify(options.bom)}`
      ],
      options
    );
  }
  options.cast_function = null;
  if (options.cast === void 0 || options.cast === null || options.cast === false || options.cast === "") {
    options.cast = void 0;
  } else if (typeof options.cast === "function") {
    options.cast_function = options.cast;
    options.cast = true;
  } else if (options.cast !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST",
      [
        "Invalid option cast:",
        "cast must be true or a function,",
        `got ${JSON.stringify(options.cast)}`
      ],
      options
    );
  }
  if (options.cast_date === void 0 || options.cast_date === null || options.cast_date === false || options.cast_date === "") {
    options.cast_date = false;
  } else if (options.cast_date === true) {
    options.cast_date = function(value) {
      const date = Date.parse(value);
      return !isNaN(date) ? new Date(date) : value;
    };
  } else if (typeof options.cast_date !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_CAST_DATE",
      [
        "Invalid option cast_date:",
        "cast_date must be true or a function,",
        `got ${JSON.stringify(options.cast_date)}`
      ],
      options
    );
  }
  options.cast_first_line_to_header = void 0;
  if (options.columns === true) {
    options.cast_first_line_to_header = void 0;
  } else if (typeof options.columns === "function") {
    options.cast_first_line_to_header = options.columns;
    options.columns = true;
  } else if (Array.isArray(options.columns)) {
    options.columns = normalize_columns_array(options.columns);
  } else if (options.columns === void 0 || options.columns === null || options.columns === false) {
    options.columns = false;
  } else {
    throw new CsvError(
      "CSV_INVALID_OPTION_COLUMNS",
      [
        "Invalid option columns:",
        "expect an array, a function or true,",
        `got ${JSON.stringify(options.columns)}`
      ],
      options
    );
  }
  if (options.group_columns_by_name === void 0 || options.group_columns_by_name === null || options.group_columns_by_name === false) {
    options.group_columns_by_name = false;
  } else if (options.group_columns_by_name !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "expect an boolean,",
        `got ${JSON.stringify(options.group_columns_by_name)}`
      ],
      options
    );
  } else if (options.columns === false) {
    throw new CsvError(
      "CSV_INVALID_OPTION_GROUP_COLUMNS_BY_NAME",
      [
        "Invalid option group_columns_by_name:",
        "the `columns` mode must be activated."
      ],
      options
    );
  }
  if (options.comment === void 0 || options.comment === null || options.comment === false || options.comment === "") {
    options.comment = null;
  } else {
    if (typeof options.comment === "string") {
      options.comment = Buffer.from(options.comment, options.encoding);
    }
    if (!Buffer.isBuffer(options.comment)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_COMMENT",
        [
          "Invalid option comment:",
          "comment must be a buffer or a string,",
          `got ${JSON.stringify(options.comment)}`
        ],
        options
      );
    }
  }
  if (options.comment_no_infix === void 0 || options.comment_no_infix === null || options.comment_no_infix === false) {
    options.comment_no_infix = false;
  } else if (options.comment_no_infix !== true) {
    throw new CsvError(
      "CSV_INVALID_OPTION_COMMENT",
      [
        "Invalid option comment_no_infix:",
        "value must be a boolean,",
        `got ${JSON.stringify(options.comment_no_infix)}`
      ],
      options
    );
  }
  if (options.delimiter_auto === void 0 || options.delimiter_auto === null || options.delimiter_auto === false) {
    options.delimiter_auto = false;
  } else if (options.delimiter_auto === true) {
    options.delimiter_auto = {};
  } else if (!is_object(options.delimiter_auto)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_DELIMITER_AUTO",
      [
        "Invalid option delimiter_auto:",
        "delimiter_auto must be a boolean or a configuration object,",
        `got ${JSON.stringify(options.delimiter_auto)}`
      ],
      options
    );
  }
  if (options.delimiter_auto) {
    if (options.delimiter_auto.preferred === void 0)
      options.delimiter_auto.preferred = {
        [",".charCodeAt(0)]: 1.8,
        ["	".charCodeAt(0)]: 1.8,
        [";".charCodeAt(0)]: 1.6,
        [" ".charCodeAt(0)]: 1.6,
        [":".charCodeAt(0)]: 1.5,
        [".".charCodeAt(0)]: 1.4,
        ["/".charCodeAt(0)]: 1.4
      };
    else if (!is_object(options.delimiter_auto.preferred)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "preferred must be an object,",
          `got ${JSON.stringify(options.delimiter_auto.preferred)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.score === void 0)
      options.delimiter_auto.score = (info, options2) => {
        return (info.total - info.std) * (options2.preferred[info.char_code] || 1);
      };
    else if (typeof options.delimiter_auto.score !== "function") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "score must be a function,",
          `got ${JSON.stringify(options.delimiter_auto.score)}`
        ],
        options
      );
    }
    if (options.delimiter_auto.size === void 0)
      options.delimiter_auto.size = 2048;
    else if (typeof options.delimiter_auto.size !== "number") {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER_AUTO",
        [
          "Invalid option delimiter_auto:",
          "size must be a number,",
          `got ${JSON.stringify(options.delimiter_auto.size)}`
        ],
        options
      );
    }
  }
  const delimiter_json = JSON.stringify(options.delimiter);
  if (options.delimiter_auto !== false) {
    options.delimiter = [];
  }
  if (!Array.isArray(options.delimiter)) {
    if (options.delimiter === void 0 || options.delimiter === null || options.delimiter === false) {
      options.delimiter = Buffer.from(",", options.encoding);
    }
    options.delimiter = [options.delimiter];
  }
  options.delimiter = options.delimiter.map(function(delimiter) {
    if (typeof delimiter === "string") {
      delimiter = Buffer.from(delimiter, options.encoding);
    }
    if (!Buffer.isBuffer(delimiter) || delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_DELIMITER",
        [
          "Invalid option delimiter:",
          "delimiter must be a non empty string or buffer or array of string|buffer,",
          `got ${delimiter_json}`
        ],
        options
      );
    }
    return delimiter;
  });
  if (options.escape === void 0 || options.escape === true) {
    options.escape = Buffer.from('"', options.encoding);
  } else if (typeof options.escape === "string") {
    options.escape = Buffer.from(options.escape, options.encoding);
  } else if (options.escape === null || options.escape === false) {
    options.escape = null;
  }
  if (options.escape !== null) {
    if (!Buffer.isBuffer(options.escape)) {
      throw new Error(
        `Invalid Option: escape must be a buffer, a string or a boolean, got ${JSON.stringify(options.escape)}`
      );
    }
  }
  if (options.from === void 0 || options.from === null) {
    options.from = 1;
  } else {
    if (typeof options.from === "string" && /\d+/.test(options.from)) {
      options.from = parseInt(options.from);
    }
    if (Number.isInteger(options.from)) {
      if (options.from < 0) {
        throw new Error(
          `Invalid Option: from must be a positive integer, got ${JSON.stringify(opts.from)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from must be an integer, got ${JSON.stringify(options.from)}`
      );
    }
  }
  if (options.from_line === void 0 || options.from_line === null) {
    options.from_line = 1;
  } else {
    if (typeof options.from_line === "string" && /\d+/.test(options.from_line)) {
      options.from_line = parseInt(options.from_line);
    }
    if (Number.isInteger(options.from_line)) {
      if (options.from_line <= 0) {
        throw new Error(
          `Invalid Option: from_line must be a positive integer greater than 0, got ${JSON.stringify(opts.from_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: from_line must be an integer, got ${JSON.stringify(opts.from_line)}`
      );
    }
  }
  if (options.ignore_last_delimiters === void 0 || options.ignore_last_delimiters === null) {
    options.ignore_last_delimiters = false;
  } else if (typeof options.ignore_last_delimiters === "number") {
    options.ignore_last_delimiters = Math.floor(options.ignore_last_delimiters);
    if (options.ignore_last_delimiters === 0) {
      options.ignore_last_delimiters = false;
    }
  } else if (typeof options.ignore_last_delimiters !== "boolean") {
    throw new CsvError(
      "CSV_INVALID_OPTION_IGNORE_LAST_DELIMITERS",
      [
        "Invalid option `ignore_last_delimiters`:",
        "the value must be a boolean value or an integer,",
        `got ${JSON.stringify(options.ignore_last_delimiters)}`
      ],
      options
    );
  }
  if (options.ignore_last_delimiters === true && options.columns === false) {
    throw new CsvError(
      "CSV_IGNORE_LAST_DELIMITERS_REQUIRES_COLUMNS",
      [
        "The option `ignore_last_delimiters`",
        "requires the activation of the `columns` option"
      ],
      options
    );
  }
  if (options.info === void 0 || options.info === null || options.info === false) {
    options.info = false;
  } else if (options.info !== true) {
    throw new Error(
      `Invalid Option: info must be true, got ${JSON.stringify(options.info)}`
    );
  }
  if (options.max_record_size === void 0 || options.max_record_size === null || options.max_record_size === false) {
    options.max_record_size = 0;
  } else if (Number.isInteger(options.max_record_size) && options.max_record_size >= 0) {
  } else if (typeof options.max_record_size === "string" && /\d+/.test(options.max_record_size)) {
    options.max_record_size = parseInt(options.max_record_size);
  } else {
    throw new Error(
      `Invalid Option: max_record_size must be a positive integer, got ${JSON.stringify(options.max_record_size)}`
    );
  }
  if (options.objname === void 0 || options.objname === null || options.objname === false) {
    options.objname = void 0;
  } else if (Buffer.isBuffer(options.objname)) {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty buffer`);
    }
    if (options.encoding === null) {
    } else {
      options.objname = options.objname.toString(options.encoding);
    }
  } else if (typeof options.objname === "string") {
    if (options.objname.length === 0) {
      throw new Error(`Invalid Option: objname must be a non empty string`);
    }
  } else if (typeof options.objname === "number") {
  } else {
    throw new Error(
      `Invalid Option: objname must be a string or a buffer, got ${options.objname}`
    );
  }
  if (options.objname !== void 0) {
    if (typeof options.objname === "number") {
      if (options.columns !== false) {
        throw Error(
          "Invalid Option: objname index cannot be combined with columns or be defined as a field"
        );
      }
    } else {
      if (options.columns === false) {
        throw Error(
          "Invalid Option: objname field must be combined with columns or be defined as an index"
        );
      }
    }
  }
  if (options.on_record === void 0 || options.on_record === null) {
    options.on_record = void 0;
  } else if (typeof options.on_record !== "function") {
    throw new CsvError(
      "CSV_INVALID_OPTION_ON_RECORD",
      [
        "Invalid option `on_record`:",
        "expect a function,",
        `got ${JSON.stringify(options.on_record)}`
      ],
      options
    );
  }
  if (options.on_skip !== void 0 && options.on_skip !== null && typeof options.on_skip !== "function") {
    throw new Error(
      `Invalid Option: on_skip must be a function, got ${JSON.stringify(options.on_skip)}`
    );
  }
  if (options.quote === null || options.quote === false || options.quote === "") {
    options.quote = null;
  } else {
    if (options.quote === void 0 || options.quote === true) {
      options.quote = Buffer.from('"', options.encoding);
    } else if (typeof options.quote === "string") {
      options.quote = Buffer.from(options.quote, options.encoding);
    }
    if (!Buffer.isBuffer(options.quote)) {
      throw new Error(
        `Invalid Option: quote must be a buffer or a string, got ${JSON.stringify(options.quote)}`
      );
    }
  }
  if (options.raw === void 0 || options.raw === null || options.raw === false) {
    options.raw = false;
  } else if (options.raw !== true) {
    throw new Error(
      `Invalid Option: raw must be true, got ${JSON.stringify(options.raw)}`
    );
  }
  if (options.record_delimiter === void 0) {
    options.record_delimiter = [];
  } else if (typeof options.record_delimiter === "string" || Buffer.isBuffer(options.record_delimiter)) {
    if (options.record_delimiter.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer,",
          `got ${JSON.stringify(options.record_delimiter)}`
        ],
        options
      );
    }
    options.record_delimiter = [options.record_delimiter];
  } else if (!Array.isArray(options.record_delimiter)) {
    throw new CsvError(
      "CSV_INVALID_OPTION_RECORD_DELIMITER",
      [
        "Invalid option `record_delimiter`:",
        "value must be a string, a buffer or array of string|buffer,",
        `got ${JSON.stringify(options.record_delimiter)}`
      ],
      options
    );
  }
  options.record_delimiter = options.record_delimiter.map(function(rd, i) {
    if (typeof rd !== "string" && !Buffer.isBuffer(rd)) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a string, a buffer or array of string|buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    } else if (rd.length === 0) {
      throw new CsvError(
        "CSV_INVALID_OPTION_RECORD_DELIMITER",
        [
          "Invalid option `record_delimiter`:",
          "value must be a non empty string or buffer",
          `at index ${i},`,
          `got ${JSON.stringify(rd)}`
        ],
        options
      );
    }
    if (typeof rd === "string") {
      rd = Buffer.from(rd, options.encoding);
    }
    return rd;
  });
  if (typeof options.relax_column_count === "boolean") {
  } else if (options.relax_column_count === void 0 || options.relax_column_count === null) {
    options.relax_column_count = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count must be a boolean, got ${JSON.stringify(options.relax_column_count)}`
    );
  }
  if (typeof options.relax_column_count_less === "boolean") {
  } else if (options.relax_column_count_less === void 0 || options.relax_column_count_less === null) {
    options.relax_column_count_less = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_less must be a boolean, got ${JSON.stringify(options.relax_column_count_less)}`
    );
  }
  if (typeof options.relax_column_count_more === "boolean") {
  } else if (options.relax_column_count_more === void 0 || options.relax_column_count_more === null) {
    options.relax_column_count_more = false;
  } else {
    throw new Error(
      `Invalid Option: relax_column_count_more must be a boolean, got ${JSON.stringify(options.relax_column_count_more)}`
    );
  }
  if (typeof options.relax_quotes === "boolean") {
  } else if (options.relax_quotes === void 0 || options.relax_quotes === null) {
    options.relax_quotes = false;
  } else {
    throw new Error(
      `Invalid Option: relax_quotes must be a boolean, got ${JSON.stringify(options.relax_quotes)}`
    );
  }
  if (typeof options.skip_empty_lines === "boolean") {
  } else if (options.skip_empty_lines === void 0 || options.skip_empty_lines === null) {
    options.skip_empty_lines = false;
  } else {
    throw new Error(
      `Invalid Option: skip_empty_lines must be a boolean, got ${JSON.stringify(options.skip_empty_lines)}`
    );
  }
  if (typeof options.skip_records_with_empty_values === "boolean") {
  } else if (options.skip_records_with_empty_values === void 0 || options.skip_records_with_empty_values === null) {
    options.skip_records_with_empty_values = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_empty_values must be a boolean, got ${JSON.stringify(options.skip_records_with_empty_values)}`
    );
  }
  if (typeof options.skip_records_with_error === "boolean") {
  } else if (options.skip_records_with_error === void 0 || options.skip_records_with_error === null) {
    options.skip_records_with_error = false;
  } else {
    throw new Error(
      `Invalid Option: skip_records_with_error must be a boolean, got ${JSON.stringify(options.skip_records_with_error)}`
    );
  }
  if (options.rtrim === void 0 || options.rtrim === null || options.rtrim === false) {
    options.rtrim = false;
  } else if (options.rtrim !== true) {
    throw new Error(
      `Invalid Option: rtrim must be a boolean, got ${JSON.stringify(options.rtrim)}`
    );
  }
  if (options.ltrim === void 0 || options.ltrim === null || options.ltrim === false) {
    options.ltrim = false;
  } else if (options.ltrim !== true) {
    throw new Error(
      `Invalid Option: ltrim must be a boolean, got ${JSON.stringify(options.ltrim)}`
    );
  }
  if (options.trim === void 0 || options.trim === null || options.trim === false) {
    options.trim = false;
  } else if (options.trim !== true) {
    throw new Error(
      `Invalid Option: trim must be a boolean, got ${JSON.stringify(options.trim)}`
    );
  }
  if (options.trim === true && opts.ltrim !== false) {
    options.ltrim = true;
  } else if (options.ltrim !== true) {
    options.ltrim = false;
  }
  if (options.trim === true && opts.rtrim !== false) {
    options.rtrim = true;
  } else if (options.rtrim !== true) {
    options.rtrim = false;
  }
  if (options.to === void 0 || options.to === null) {
    options.to = -1;
  } else if (options.to !== -1) {
    if (typeof options.to === "string" && /\d+/.test(options.to)) {
      options.to = parseInt(options.to);
    }
    if (Number.isInteger(options.to)) {
      if (options.to <= 0) {
        throw new Error(
          `Invalid Option: to must be a positive integer greater than 0, got ${JSON.stringify(opts.to)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to must be an integer, got ${JSON.stringify(opts.to)}`
      );
    }
  }
  if (options.to_line === void 0 || options.to_line === null) {
    options.to_line = -1;
  } else if (options.to_line !== -1) {
    if (typeof options.to_line === "string" && /\d+/.test(options.to_line)) {
      options.to_line = parseInt(options.to_line);
    }
    if (Number.isInteger(options.to_line)) {
      if (options.to_line <= 0) {
        throw new Error(
          `Invalid Option: to_line must be a positive integer greater than 0, got ${JSON.stringify(opts.to_line)}`
        );
      }
    } else {
      throw new Error(
        `Invalid Option: to_line must be an integer, got ${JSON.stringify(opts.to_line)}`
      );
    }
  }
  return options;
};

// node_modules/csv-parse/lib/utils/delimiter_discover.js
var delimiter_discover = function(records, options) {
  if (!options) {
    ({ delimiter_auto: options } = normalize_options({ delimiter_auto: true }));
  }
  if (typeof records === "string") {
    records = Buffer.from(records);
  }
  if (Buffer.isBuffer(records)) {
    records = ((data) => {
      const records2 = [];
      const parser = transform({ delimiter: [] });
      const push = (record) => records2.push(record);
      const close = () => {
      };
      const error = parser.parse(data, true, push, close);
      if (error !== void 0) throw error;
      return records2;
    })(records);
  }
  const info = Array(127).fill().map(() => ({ lines: [] }));
  records.map(([record], line) => {
    for (let i = 0, l = record.length; i < l; i++) {
      const code = record.charCodeAt(i);
      if (info[code].lines[line] === void 0) info[code].lines[line] = 0;
      info[code].lines[line]++;
    }
  });
  info.map((info2, i) => {
    info2.char_code = i;
    info2.std = std(info2.lines);
    info2.total = info2.lines.reduce((acc, val) => acc + val, 0);
    info2.preferred = !!options.preferred[i];
    info2.score = options.score(info2, options);
  });
  const result = info.reduce(
    (acc, info2) => acc.score > info2.score ? acc : info2,
    {}
  );
  return String.fromCharCode(result.char_code);
};
var std = function(array) {
  const n = array.length;
  if (n === 0) return 0;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
};

// node_modules/csv-parse/lib/api/index.js
var isRecordEmpty = function(record) {
  return record.every(
    (field) => field == null || field.toString && field.toString().trim() === ""
  );
};
var cr = 13;
var nl = 10;
var boms = {
  // Note, the following are equals:
  // Buffer.from("\ufeff")
  // Buffer.from([239, 187, 191])
  // Buffer.from('EFBBBF', 'hex')
  utf8: Buffer.from([239, 187, 191]),
  // Note, the following are equals:
  // Buffer.from "\ufeff", 'utf16le
  // Buffer.from([255, 254])
  utf16le: Buffer.from([255, 254])
};
var transform = function(original_options = {}) {
  const info = {
    bytes: 0,
    bytes_records: 0,
    comment_lines: 0,
    empty_lines: 0,
    invalid_field_length: 0,
    lines: 1,
    records: 0
  };
  const options = normalize_options(original_options);
  return {
    info,
    original_options,
    options,
    state: init_state(options),
    __needMoreData: function(i, bufLen, end) {
      if (end) return false;
      const { encoding, escape, quote } = this.options;
      const { quoting, needMoreDataSize, recordDelimiterMaxLength } = this.state;
      const numOfCharLeft = bufLen - i - 1;
      const requiredLength = Math.max(
        needMoreDataSize,
        // Skip if the remaining buffer smaller than record delimiter
        // If "record_delimiter" is yet to be discovered:
        // 1. It is equals to `[]` and "recordDelimiterMaxLength" equals `0`
        // 2. We set the length to windows line ending in the current encoding
        // Note, that encoding is known from user or bom discovery at that point
        // recordDelimiterMaxLength,
        recordDelimiterMaxLength === 0 ? Buffer.from("\r\n", encoding).length : recordDelimiterMaxLength,
        // Skip if remaining buffer can be an escaped quote
        quoting ? (escape === null ? 0 : escape.length) + quote.length : 0,
        // Skip if remaining buffer can be record delimiter following the closing quote
        quoting ? quote.length + recordDelimiterMaxLength : 0
      );
      return numOfCharLeft < requiredLength;
    },
    // Central parser implementation
    parse: function(nextBuf, end, push, close) {
      const {
        bom,
        comment_no_infix,
        delimiter_auto,
        encoding,
        from_line,
        ltrim,
        max_record_size,
        raw,
        relax_quotes,
        rtrim,
        skip_empty_lines,
        to,
        to_line
      } = this.options;
      let { comment, escape, quote, record_delimiter } = this.options;
      const {
        bomSkipped,
        delimiterDiscovered,
        delimiterBufPrevious,
        rawBuffer,
        escapeIsQuote
      } = this.state;
      if (!delimiterDiscovered && delimiter_auto) {
        let delimiterBuf;
        if (delimiterBufPrevious === void 0) {
          delimiterBuf = nextBuf;
        } else if (delimiterBufPrevious !== void 0 && nextBuf === void 0) {
          delimiterBuf = delimiterBufPrevious;
        } else {
          delimiterBuf = Buffer.concat([delimiterBufPrevious, nextBuf]);
        }
        nextBuf = void 0;
        if (end || delimiterBuf.length > delimiter_auto.size) {
          this.options.delimiter = [
            Buffer.from(
              delimiter_discover(delimiterBuf, this.options.delimiter_auto)
            )
          ];
          this.state.previousBuf = delimiterBuf;
          this.state.delimiterBufPrevious = void 0;
          this.state.delimiterDiscovered = true;
        } else {
          this.state.delimiterBufPrevious = delimiterBuf;
          return;
        }
      }
      const { previousBuf } = this.state;
      let buf;
      if (previousBuf === void 0) {
        if (nextBuf === void 0) {
          close();
          return;
        } else {
          buf = nextBuf;
        }
      } else if (previousBuf !== void 0 && nextBuf === void 0) {
        buf = previousBuf;
      } else {
        buf = Buffer.concat([previousBuf, nextBuf]);
      }
      if (bomSkipped === false) {
        if (bom === false) {
          this.state.bomSkipped = true;
        } else if (buf.length < 3) {
          if (end === false) {
            this.state.previousBuf = buf;
            return;
          }
        } else {
          for (const encoding2 in boms) {
            if (boms[encoding2].compare(buf, 0, boms[encoding2].length) === 0) {
              const bomLength = boms[encoding2].length;
              this.state.bufBytesStart += bomLength;
              buf = buf.slice(bomLength);
              const options2 = normalize_options({
                ...this.original_options,
                encoding: encoding2
              });
              for (const key in options2) {
                this.options[key] = options2[key];
              }
              ({ comment, escape, quote } = this.options);
              break;
            }
          }
          this.state.bomSkipped = true;
        }
      }
      const bufLen = buf.length;
      let pos;
      for (pos = 0; pos < bufLen; pos++) {
        if (this.__needMoreData(pos, bufLen, end)) {
          break;
        }
        if (this.state.wasRowDelimiter === true) {
          this.info.lines++;
          this.state.wasRowDelimiter = false;
        }
        if (to_line !== -1 && this.info.lines > to_line) {
          this.state.stop = true;
          close();
          return;
        }
        if (this.state.quoting === false && record_delimiter.length === 0) {
          const record_delimiterCount = this.__autoDiscoverRecordDelimiter(
            buf,
            pos
          );
          if (record_delimiterCount) {
            record_delimiter = this.options.record_delimiter;
          }
        }
        const chr = buf[pos];
        if (raw === true) {
          rawBuffer.append(chr);
        }
        if ((chr === cr || chr === nl) && this.state.wasRowDelimiter === false) {
          this.state.wasRowDelimiter = true;
        }
        if (this.state.escaping === true) {
          this.state.escaping = false;
        } else {
          if (escape !== null && this.state.quoting === true && this.__isEscape(buf, pos, chr) && pos + escape.length < bufLen) {
            if (escapeIsQuote) {
              if (this.__isQuote(buf, pos + escape.length)) {
                this.state.escaping = true;
                pos += escape.length - 1;
                continue;
              }
            } else {
              this.state.escaping = true;
              pos += escape.length - 1;
              continue;
            }
          }
          if (this.state.commenting === false && this.__isQuote(buf, pos)) {
            if (this.state.quoting === true) {
              const nextChr = buf[pos + quote.length];
              const isNextChrTrimable = rtrim && this.__isCharTrimable(buf, pos + quote.length);
              const isNextChrComment = comment !== null && this.__compareBytes(comment, buf, pos + quote.length, nextChr);
              const isNextChrDelimiter = this.__isDelimiter(
                buf,
                pos + quote.length,
                nextChr
              );
              const isNextChrRecordDelimiter = record_delimiter.length === 0 ? this.__autoDiscoverRecordDelimiter(buf, pos + quote.length) : this.__isRecordDelimiter(nextChr, buf, pos + quote.length);
              if (escape !== null && this.__isEscape(buf, pos, chr) && this.__isQuote(buf, pos + escape.length)) {
                pos += escape.length - 1;
              } else if (!nextChr || isNextChrDelimiter || isNextChrRecordDelimiter || isNextChrComment || isNextChrTrimable) {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                pos += quote.length - 1;
                continue;
              } else if (relax_quotes === false) {
                const err = this.__error(
                  new CsvError(
                    "CSV_INVALID_CLOSING_QUOTE",
                    [
                      "Invalid Closing Quote:",
                      `got "${String.fromCharCode(nextChr)}"`,
                      `at line ${this.info.lines}`,
                      "instead of delimiter, record delimiter, trimable character",
                      "(if activated) or comment"
                    ],
                    this.options,
                    this.__infoField()
                  )
                );
                if (err !== void 0) return err;
              } else {
                this.state.quoting = false;
                this.state.wasQuoting = true;
                this.state.field.prepend(quote);
                pos += quote.length - 1;
              }
            } else {
              if (this.state.field.length !== 0) {
                if (relax_quotes === false) {
                  const info2 = this.__infoField();
                  const bom2 = Object.keys(boms).map(
                    (b) => boms[b].equals(this.state.field.toString()) ? b : false
                  ).filter(Boolean)[0];
                  const err = this.__error(
                    new CsvError(
                      "INVALID_OPENING_QUOTE",
                      [
                        "Invalid Opening Quote:",
                        `a quote is found on field ${JSON.stringify(info2.column)} at line ${info2.lines}, value is ${JSON.stringify(this.state.field.toString(encoding))}`,
                        bom2 ? `(${bom2} bom)` : void 0
                      ],
                      this.options,
                      info2,
                      {
                        field: this.state.field
                      }
                    )
                  );
                  if (err !== void 0) return err;
                }
              } else {
                this.state.quoting = true;
                pos += quote.length - 1;
                continue;
              }
            }
          }
          if (this.state.quoting === false) {
            const recordDelimiterLength = this.__isRecordDelimiter(
              chr,
              buf,
              pos
            );
            if (recordDelimiterLength !== 0) {
              const skipCommentLine = this.state.commenting && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0;
              if (skipCommentLine) {
                this.info.comment_lines++;
              } else {
                if (this.state.enabled === false && this.info.lines + (this.state.wasRowDelimiter === true ? 1 : 0) >= from_line) {
                  this.state.enabled = true;
                  this.__resetField();
                  this.__resetRecord();
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                if (skip_empty_lines === true && this.state.wasQuoting === false && this.state.record.length === 0 && this.state.field.length === 0) {
                  this.info.empty_lines++;
                  pos += recordDelimiterLength - 1;
                  continue;
                }
                this.info.bytes = this.state.bufBytesStart + pos;
                const errField = this.__onField();
                if (errField !== void 0) return errField;
                this.info.bytes = this.state.bufBytesStart + pos + recordDelimiterLength;
                const errRecord = this.__onRecord(push);
                if (errRecord !== void 0) return errRecord;
                if (to !== -1 && this.info.records >= to) {
                  this.state.stop = true;
                  close();
                  return;
                }
              }
              this.state.commenting = false;
              pos += recordDelimiterLength - 1;
              continue;
            }
            if (this.state.commenting) {
              continue;
            }
            if (comment !== null && (comment_no_infix === false || this.state.record.length === 0 && this.state.field.length === 0)) {
              const commentCount = this.__compareBytes(comment, buf, pos, chr);
              if (commentCount !== 0) {
                this.state.commenting = true;
                continue;
              }
            }
            const delimiterLength = this.__isDelimiter(buf, pos, chr);
            if (delimiterLength !== 0) {
              this.info.bytes = this.state.bufBytesStart + pos;
              const errField = this.__onField();
              if (errField !== void 0) return errField;
              pos += delimiterLength - 1;
              continue;
            }
          }
        }
        if (this.state.commenting === false) {
          if (max_record_size !== 0 && this.state.record_length + this.state.field.length > max_record_size) {
            return this.__error(
              new CsvError(
                "CSV_MAX_RECORD_SIZE",
                [
                  "Max Record Size:",
                  "record exceed the maximum number of tolerated bytes",
                  `of ${max_record_size}`,
                  `at line ${this.info.lines}`
                ],
                this.options,
                this.__infoField()
              )
            );
          }
        }
        const lappend = ltrim === false || this.state.quoting === true || this.state.field.length !== 0 || !this.__isCharTrimable(buf, pos);
        const rappend = rtrim === false || this.state.wasQuoting === false;
        if (lappend === true && rappend === true) {
          this.state.field.append(chr);
        } else if (rtrim === true && !this.__isCharTrimable(buf, pos)) {
          return this.__error(
            new CsvError(
              "CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE",
              [
                "Invalid Closing Quote:",
                "found non trimable byte after quote",
                `at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
        } else {
          if (lappend === false) {
            pos += this.__isCharTrimable(buf, pos) - 1;
          }
          continue;
        }
      }
      if (end === true) {
        if (this.state.quoting === true) {
          const err = this.__error(
            new CsvError(
              "CSV_QUOTE_NOT_CLOSED",
              [
                "Quote Not Closed:",
                `the parsing is finished with an opening quote at line ${this.info.lines}`
              ],
              this.options,
              this.__infoField()
            )
          );
          if (err !== void 0) return err;
        } else {
          if (this.state.wasQuoting === true || this.state.record.length !== 0 || this.state.field.length !== 0) {
            this.info.bytes = this.state.bufBytesStart + pos;
            const errField = this.__onField();
            if (errField !== void 0) return errField;
            const errRecord = this.__onRecord(push);
            if (errRecord !== void 0) return errRecord;
          } else if (this.state.wasRowDelimiter === true) {
            this.info.empty_lines++;
          } else if (this.state.commenting === true) {
            this.info.comment_lines++;
          }
        }
      } else {
        this.state.bufBytesStart += pos;
        this.state.previousBuf = buf.slice(pos);
      }
      if (this.state.wasRowDelimiter === true) {
        this.info.lines++;
        this.state.wasRowDelimiter = false;
      }
    },
    __onRecord: function(push) {
      const {
        columns,
        group_columns_by_name,
        encoding,
        info: info2,
        from,
        relax_column_count,
        relax_column_count_less,
        relax_column_count_more,
        raw,
        skip_records_with_empty_values
      } = this.options;
      const { enabled, record } = this.state;
      if (enabled === false) {
        return this.__resetRecord();
      }
      const recordLength = record.length;
      if (columns === true) {
        if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
          this.__resetRecord();
          return;
        }
        return this.__firstLineToColumns(record);
      }
      if (columns === false && this.info.records === 0) {
        this.state.expectedRecordLength = recordLength;
      }
      if (recordLength !== this.state.expectedRecordLength) {
        const err = columns === false ? new CsvError(
          "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH",
          [
            "Invalid Record Length:",
            `expect ${this.state.expectedRecordLength},`,
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        ) : new CsvError(
          "CSV_RECORD_INCONSISTENT_COLUMNS",
          [
            "Invalid Record Length:",
            `columns length is ${columns.length},`,
            // rename columns
            `got ${recordLength} on line ${this.info.lines}`
          ],
          this.options,
          this.__infoField(),
          {
            record
          }
        );
        if (relax_column_count === true || relax_column_count_less === true && recordLength < this.state.expectedRecordLength || relax_column_count_more === true && recordLength > this.state.expectedRecordLength) {
          this.info.invalid_field_length++;
          this.state.error = err;
        } else {
          const finalErr = this.__error(err);
          if (finalErr) return finalErr;
        }
      }
      if (skip_records_with_empty_values === true && isRecordEmpty(record)) {
        this.__resetRecord();
        return;
      }
      if (this.state.recordHasError === true) {
        this.__resetRecord();
        this.state.recordHasError = false;
        return;
      }
      this.info.records++;
      if (from === 1 || this.info.records >= from) {
        const { objname } = this.options;
        if (columns !== false) {
          const obj = {};
          for (let i = 0, l = record.length; i < l; i++) {
            if (columns[i] === void 0 || columns[i].disabled) continue;
            if (group_columns_by_name === true && Object.hasOwn(obj, columns[i].name)) {
              if (Array.isArray(obj[columns[i].name])) {
                obj[columns[i].name] = obj[columns[i].name].concat(record[i]);
              } else {
                obj[columns[i].name] = [obj[columns[i].name], record[i]];
              }
            } else {
              Object.defineProperty(obj, columns[i].name, {
                value: record[i],
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
          }
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record: obj },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [obj[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? obj : [obj[objname], obj],
              push
            );
            if (err) {
              return err;
            }
          }
        } else {
          if (raw === true || info2 === true) {
            const extRecord = Object.assign(
              { record },
              raw === true ? { raw: this.state.rawBuffer.toString(encoding) } : {},
              info2 === true ? { info: this.__infoRecord() } : {}
            );
            const err = this.__push(
              objname === void 0 ? extRecord : [record[objname], extRecord],
              push
            );
            if (err) {
              return err;
            }
          } else {
            const err = this.__push(
              objname === void 0 ? record : [record[objname], record],
              push
            );
            if (err) {
              return err;
            }
          }
        }
      }
      this.__resetRecord();
    },
    __firstLineToColumns: function(record) {
      const { firstLineToHeaders } = this.state;
      try {
        const headers = firstLineToHeaders === void 0 ? record : firstLineToHeaders.call(null, record);
        if (!Array.isArray(headers)) {
          return this.__error(
            new CsvError(
              "CSV_INVALID_COLUMN_MAPPING",
              [
                "Invalid Column Mapping:",
                "expect an array from column function,",
                `got ${JSON.stringify(headers)}`
              ],
              this.options,
              this.__infoField(),
              {
                headers
              }
            )
          );
        }
        const normalizedHeaders = normalize_columns_array(headers);
        this.state.expectedRecordLength = normalizedHeaders.length;
        this.options.columns = normalizedHeaders;
        this.__resetRecord();
        return;
      } catch (err) {
        return err;
      }
    },
    __resetRecord: function() {
      if (this.options.raw === true) {
        this.state.rawBuffer.reset();
      }
      this.state.error = void 0;
      this.state.record = [];
      this.state.record_length = 0;
    },
    __onField: function() {
      const { cast, encoding, rtrim, max_record_size } = this.options;
      const { enabled, wasQuoting } = this.state;
      if (enabled === false) {
        return this.__resetField();
      }
      let field = this.state.field.toString(encoding);
      if (rtrim === true && wasQuoting === false) {
        field = field.trimRight();
      }
      if (cast === true) {
        const [err, f] = this.__cast(field);
        if (err !== void 0) return err;
        field = f;
      }
      this.state.record.push(field);
      if (max_record_size !== 0 && typeof field === "string") {
        this.state.record_length += field.length;
      }
      this.__resetField();
    },
    __resetField: function() {
      this.state.field.reset();
      this.state.wasQuoting = false;
    },
    __push: function(record, push) {
      const { on_record } = this.options;
      if (on_record !== void 0) {
        const info2 = this.__infoRecord();
        try {
          record = on_record.call(null, record, info2);
        } catch (err) {
          return err;
        }
        if (record === void 0 || record === null) {
          return;
        }
      }
      this.info.bytes_records += this.info.bytes;
      push(record);
    },
    // Return a tuple with the error and the casted value
    __cast: function(field) {
      const { columns, relax_column_count } = this.options;
      const isColumns = Array.isArray(columns);
      if (isColumns === true && relax_column_count && this.options.columns.length <= this.state.record.length) {
        return [void 0, void 0];
      }
      if (this.state.castField !== null) {
        try {
          const info2 = this.__infoField();
          return [void 0, this.state.castField.call(null, field, info2)];
        } catch (err) {
          return [err];
        }
      }
      if (this.__isFloat(field)) {
        return [void 0, parseFloat(field)];
      } else if (this.options.cast_date !== false) {
        const info2 = this.__infoField();
        return [void 0, this.options.cast_date.call(null, field, info2)];
      }
      return [void 0, field];
    },
    __compareBytes: function(sourceBuf, targetBuf, targetPos, firstByte) {
      if (sourceBuf[0] !== firstByte) return 0;
      const sourceLength = sourceBuf.length;
      for (let i = 1; i < sourceLength; i++) {
        if (sourceBuf[i] !== targetBuf[targetPos + i]) return 0;
      }
      return sourceLength;
    },
    // Helper to test if a character is trimable
    __isCharTrimable: function(buf, pos) {
      const { timchars, timcharFirstBytes } = this.state;
      const first = buf[pos];
      if (first === void 0 || timcharFirstBytes[first] === 0) return 0;
      loop1: for (let i = 0; i < timchars.length; i++) {
        const timchar = timchars[i];
        for (let j = 0; j < timchar.length; j++) {
          if (timchar[j] !== buf[pos + j]) continue loop1;
        }
        return timchar.length;
      }
      return 0;
    },
    __isDelimiter: function(buf, pos, chr) {
      const { delimiter, ignore_last_delimiters } = this.options;
      if (ignore_last_delimiters === true && this.state.record.length === this.options.columns.length - 1) {
        return 0;
      } else if (ignore_last_delimiters !== false && typeof ignore_last_delimiters === "number" && this.state.record.length === ignore_last_delimiters - 1) {
        return 0;
      }
      loop1: for (let i = 0; i < delimiter.length; i++) {
        const del = delimiter[i];
        if (del[0] === chr) {
          for (let j = 1; j < del.length; j++) {
            if (del[j] !== buf[pos + j]) continue loop1;
          }
          return del.length;
        }
      }
      return 0;
    },
    __isEscape: function(buf, pos, chr) {
      const { escape } = this.options;
      if (escape === null) return false;
      const l = escape.length;
      if (escape[0] === chr) {
        for (let i = 0; i < l; i++) {
          if (escape[i] !== buf[pos + i]) {
            return false;
          }
        }
        return true;
      }
      return false;
    },
    __isFloat: function(value) {
      return value - parseFloat(value) + 1 >= 0;
    },
    // Keep it in case we implement the `cast_int` option
    // __isInt(value){
    //   // return Number.isInteger(parseInt(value))
    //   // return !isNaN( parseInt( obj ) );
    //   return /^(\-|\+)?[1-9][0-9]*$/.test(value)
    // }
    __isQuote: function(buf, pos) {
      const { quote } = this.options;
      if (quote === null) return false;
      const l = quote.length;
      for (let i = 0; i < l; i++) {
        if (quote[i] !== buf[pos + i]) {
          return false;
        }
      }
      return true;
    },
    __isRecordDelimiter: function(chr, buf, pos) {
      const { record_delimiter } = this.options;
      const recordDelimiterLength = record_delimiter.length;
      loop1: for (let i = 0; i < recordDelimiterLength; i++) {
        const rd = record_delimiter[i];
        const rdLength = rd.length;
        if (rd[0] !== chr) {
          continue;
        }
        for (let j = 1; j < rdLength; j++) {
          if (rd[j] !== buf[pos + j]) {
            continue loop1;
          }
        }
        return rd.length;
      }
      return 0;
    },
    __autoDiscoverRecordDelimiter: function(buf, pos) {
      const { encoding } = this.options;
      const rds = [
        // Important, the windows line ending must be before mac os 9
        Buffer.from("\r\n", encoding),
        Buffer.from("\n", encoding),
        Buffer.from("\r", encoding)
      ];
      loop: for (let i = 0; i < rds.length; i++) {
        const l = rds[i].length;
        for (let j = 0; j < l; j++) {
          if (rds[i][j] !== buf[pos + j]) {
            continue loop;
          }
        }
        this.options.record_delimiter.push(rds[i]);
        this.state.recordDelimiterMaxLength = rds[i].length;
        return rds[i].length;
      }
      return 0;
    },
    __error: function(msg) {
      const { encoding, raw, skip_records_with_error } = this.options;
      const err = typeof msg === "string" ? new Error(msg) : msg;
      if (skip_records_with_error) {
        this.state.recordHasError = true;
        if (this.options.on_skip !== void 0) {
          try {
            this.options.on_skip(
              err,
              raw ? this.state.rawBuffer.toString(encoding) : void 0
            );
          } catch (err2) {
            return err2;
          }
        }
        return void 0;
      } else {
        return err;
      }
    },
    __infoDataSet: function() {
      return {
        ...this.info,
        columns: this.options.columns
      };
    },
    __infoRecord: function() {
      const { columns, raw, encoding } = this.options;
      return {
        ...this.__infoDataSet(),
        bytes_records: this.info.bytes,
        error: this.state.error,
        header: columns === true,
        index: this.state.record.length,
        raw: raw ? this.state.rawBuffer.toString(encoding) : void 0
      };
    },
    __infoField: function() {
      const { columns } = this.options;
      const isColumns = Array.isArray(columns);
      const bytes_records = this.info.bytes_records;
      return {
        ...this.__infoRecord(),
        bytes_records,
        column: isColumns === true ? columns.length > this.state.record.length ? columns[this.state.record.length].name : null : this.state.record.length,
        quoting: this.state.wasQuoting
      };
    }
  };
};

// node_modules/csv-parse/lib/sync.js
var parse = function(data, opts = {}) {
  if (typeof data === "string") {
    data = Buffer.from(data);
  }
  const records = opts && opts.objname ? /* @__PURE__ */ Object.create(null) : [];
  const parser = transform(opts);
  const push = (record) => {
    if (parser.options.objname === void 0) records.push(record);
    else {
      records[record[0]] = record[1];
    }
  };
  const close = () => {
  };
  const error = parser.parse(data, true, push, close);
  if (error !== void 0) throw error;
  return records;
};

// server/providers/ntaGtfsRealtime/query.ts
function parseBounds(value) {
  if (!value) return void 0;
  const parts = value.split(",").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part)))
    throw new Error("bounds must contain west,south,east,north");
  const [west, south, east, north] = parts;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west > east || south > north)
    throw new Error("Invalid bounds");
  return [west, south, east, north];
}
function insideBounds(longitude, latitude, bounds) {
  return !bounds || longitude >= bounds[0] && longitude <= bounds[2] && latitude >= bounds[1] && latitude <= bounds[3];
}
function matchesQuery(query, values) {
  const normalized = values.filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().split(/\s+/).every((word) => normalized.includes(word));
}
function queryLimit(value, fallback = 30, maximum = 200) {
  const parsed = value === null ? fallback : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

// server/providers/ntaGtfsRealtime/staticGtfs.ts
var ttlMs = 24 * 60 * 60 * 1e3;
function isBusRoute(type) {
  return type === "3" || Number(type) >= 700 && Number(type) < 800;
}
var probeTtlMs = 6 * 60 * 60 * 1e3;
var recommendedStaticGtfsUrl = "https://www.transportforireland.ie/transitData/Data/GTFS_Realtime.zip";
async function fetchStaticGtfsIndex() {
  return cached("nta-static-gtfs-index", ttlMs, async () => {
    const url = staticGtfsUrl();
    if (!url) return emptyIndex();
    const zip = new import_adm_zip.default(await readStaticGtfsZip(url));
    const routesById = new Map(parseCsv(zipText(zip, "routes.txt")).flatMap((row) => {
      const routeId = row.route_id;
      if (!routeId) return [];
      return [[routeId, {
        routeId,
        agencyId: row.agency_id,
        shortName: row.route_short_name,
        longName: row.route_long_name,
        routeType: row.route_type
      }]];
    }));
    const tripsById = new Map(parseCsv(zipText(zip, "trips.txt")).flatMap((row) => {
      const tripId = row.trip_id;
      const routeId = row.route_id;
      if (!tripId || !routeId) return [];
      return [[tripId, {
        tripId,
        routeId,
        headsign: row.trip_headsign,
        directionId: row.direction_id,
        shapeId: row.shape_id
      }]];
    }));
    const agenciesById = new Map(parseCsv(zipText(zip, "agency.txt")).flatMap((row) => {
      const name = row.agency_name;
      if (!name) return [];
      const agencyId = row.agency_id || "default";
      return [[agencyId, { agencyId: row.agency_id, name }]];
    }));
    const stopsById = new Map(parseCsv(zipText(zip, "stops.txt")).flatMap((row) => {
      const stopId = row.stop_id;
      const latitude = parseOptionalNumber(row.stop_lat);
      const longitude = parseOptionalNumber(row.stop_lon);
      if (!stopId || latitude === void 0 || longitude === void 0) return [];
      return [[stopId, {
        stopId,
        name: row.stop_name,
        latitude,
        longitude
      }]];
    }));
    return { source: staticGtfsSource(), routesById, tripsById, agenciesById, stopsById };
  });
}
async function fetchStaticGtfsRouteOptions(bounds) {
  const index = await fetchStaticGtfsIndex();
  let areaRoutes;
  if (bounds) {
    const routesByStop = await fetchStaticGtfsStopRouteIndex();
    areaRoutes = new Set([...index.stopsById.values()].filter((stop) => insideBounds(stop.longitude, stop.latitude, bounds)).flatMap((stop) => [...routesByStop.get(stop.stopId) ?? []]));
  }
  const headsignsByRouteId = /* @__PURE__ */ new Map();
  for (const trip of index.tripsById.values()) {
    if (!trip.headsign) continue;
    const headsigns = headsignsByRouteId.get(trip.routeId) ?? /* @__PURE__ */ new Set();
    if (headsigns.size < 8) headsigns.add(trip.headsign);
    headsignsByRouteId.set(trip.routeId, headsigns);
  }
  return {
    source: index.source,
    routes: [...index.routesById.values()].filter((route) => !areaRoutes || areaRoutes.has(route.routeId)).filter((route) => route.routeType === "3" || Number(route.routeType) >= 700 && Number(route.routeType) < 800).map((route) => ({
      routeId: route.routeId,
      shortName: route.shortName,
      longName: route.longName,
      operator: route.agencyId ? index.agenciesById.get(route.agencyId)?.name : index.agenciesById.get("default")?.name,
      headsigns: [...headsignsByRouteId.get(route.routeId) ?? []]
    })).sort((left, right) => routeSortLabel(left).localeCompare(routeSortLabel(right), "en", { numeric: true }))
  };
}
async function fetchStaticGtfsStopOptions() {
  const index = await fetchStaticGtfsIndex();
  const routesByStop = await fetchStaticGtfsStopRouteIndex();
  return {
    source: index.source,
    stops: [...index.stopsById.values()].filter((stop) => routesByStop.has(stop.stopId)).map((stop) => ({
      stopId: stop.stopId,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude
    })).sort((left, right) => (left.name || left.stopId).localeCompare(right.name || right.stopId, "en", { numeric: true }))
  };
}
async function fetchStaticGtfsStopServices(stopId, routeIds = [], now = /* @__PURE__ */ new Date()) {
  const index = await fetchStaticGtfsIndex();
  if (!stopId || index.source === "unavailable") return { source: index.source, services: [] };
  const routeFilter = new Set(routeIds.filter(Boolean));
  const services = await fetchStaticGtfsStopServiceIndex(stopId);
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return {
    source: index.source,
    services: (services.get(stopId) ?? []).filter((service) => !routeFilter.size || routeFilter.has(service.routeId)).filter((service) => isBusRoute(index.routesById.get(service.routeId)?.routeType)).map((service) => nextScheduledStopService(service, nowSeconds)).sort((left, right) => (left.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER) - (right.scheduledArrivalSeconds ?? Number.MAX_SAFE_INTEGER))
  };
}
var tripStopTimesCache = /* @__PURE__ */ new Map();
async function fetchStaticGtfsStopTimes(tripIds) {
  const targets = [...new Set([...tripIds].filter(Boolean))].sort();
  if (!targets.length) return /* @__PURE__ */ new Map();
  const url = staticGtfsUrl();
  if (!url) return /* @__PURE__ */ new Map();
  const now = Date.now();
  for (const [id, entry] of tripStopTimesCache) if (entry.expiresAt <= now) tripStopTimesCache.delete(id);
  const cacheKey = (id) => `${url}:${id}`;
  const missing = targets.filter((id) => !tripStopTimesCache.has(cacheKey(id)));
  if (missing.length) {
    const stopTimesByTripId = parseStopTimesForTrips(await readStaticGtfsText(url, "stop_times.txt"), new Set(missing));
    for (const stopTimes of stopTimesByTripId.values()) {
      stopTimes.sort((left, right) => (left.stopSequence ?? 0) - (right.stopSequence ?? 0));
    }
    for (const id of missing) tripStopTimesCache.set(cacheKey(id), { expiresAt: now + ttlMs, stops: stopTimesByTripId.get(id) ?? [] });
  }
  const result = new Map(targets.map((id) => [id, tripStopTimesCache.get(cacheKey(id)).stops]));
  while (tripStopTimesCache.size > 1e4) tripStopTimesCache.delete(tripStopTimesCache.keys().next().value);
  return result;
}
async function fetchStaticGtfsStopRouteIndex() {
  const index = await fetchStaticGtfsIndex();
  const url = staticGtfsUrl();
  if (!url || index.source === "unavailable") return /* @__PURE__ */ new Map();
  return cached("nta-static-bus-stop-routes", ttlMs, async () => {
    const routesByStop = /* @__PURE__ */ new Map();
    parse(await readStaticGtfsText(url, "stop_times.txt"), {
      columns: true,
      bom: true,
      skip_empty_lines: true,
      on_record(row) {
        const trip = index.tripsById.get(row.trip_id ?? "");
        if (row.stop_id && trip && isBusRoute(index.routesById.get(trip.routeId)?.routeType)) {
          const routes = routesByStop.get(row.stop_id) ?? /* @__PURE__ */ new Set();
          routes.add(trip.routeId);
          routesByStop.set(row.stop_id, routes);
        }
        return null;
      }
    });
    return routesByStop;
  });
}
async function fetchStaticGtfsStopServiceIndex(stopId) {
  const index = await fetchStaticGtfsIndex();
  const url = staticGtfsUrl();
  if (!url || index.source === "unavailable") return /* @__PURE__ */ new Map();
  return cached(`nta-static-gtfs-stop-services:${stopId}`, ttlMs, async () => {
    return parseStopServices(await readStaticGtfsText(url, "stop_times.txt"), index, stopId);
  });
}
async function fetchStaticGtfsTripContext(tripId) {
  const index = await fetchStaticGtfsIndex();
  const trip = index.tripsById.get(tripId);
  const route = trip?.routeId ? index.routesById.get(trip.routeId) : void 0;
  const stopTimes = (await fetchStaticGtfsStopTimes([tripId])).get(tripId) ?? [];
  const stops = stopTimes.map((stopTime) => {
    const stop = index.stopsById.get(stopTime.stopId);
    return {
      ...stopTime,
      name: stop?.name,
      latitude: stop?.latitude,
      longitude: stop?.longitude
    };
  });
  const shape = trip?.shapeId ? await fetchStaticGtfsShape(trip.shapeId) : [];
  return { source: index.source, trip, route, stops, shape };
}
async function fetchStaticGtfsShape(shapeId) {
  const url = staticGtfsUrl();
  if (!url || !shapeId) return [];
  return cached(`nta-static-gtfs-shape:${(0, import_node_crypto.createHash)("sha256").update(shapeId).digest("hex").slice(0, 16)}`, ttlMs, async () => {
    return parseShapesForShapeId(await readStaticGtfsText(url, "shapes.txt"), shapeId).sort((left, right) => left.sequence - right.sequence);
  });
}
async function probeRecommendedStaticGtfs() {
  return cached("nta-static-gtfs-recommended-probe", probeTtlMs, async () => {
    const response = await fetch(recommendedStaticGtfsUrl, { method: "HEAD" });
    if (!response.ok) throw new Error(`recommended NTA static GTFS responded ${response.status}`);
    return {
      url: recommendedStaticGtfsUrl,
      reachable: true,
      contentType: response.headers.get("content-type") ?? void 0,
      contentLength: parseOptionalNumber(response.headers.get("content-length") ?? void 0),
      lastModified: response.headers.get("last-modified") ?? void 0
    };
  });
}
function emptyIndex() {
  return {
    source: "unavailable",
    routesById: /* @__PURE__ */ new Map(),
    tripsById: /* @__PURE__ */ new Map(),
    agenciesById: /* @__PURE__ */ new Map(),
    stopsById: /* @__PURE__ */ new Map()
  };
}
function staticGtfsUrl() {
  return process.env.NTA_GTFS_STATIC_URL?.trim() || (process.env.NTA_DISABLE_RECOMMENDED_STATIC_GTFS?.trim() === "1" ? void 0 : recommendedStaticGtfsUrl);
}
function staticGtfsSource() {
  return process.env.NTA_GTFS_STATIC_URL?.trim() ? "configured" : "recommended";
}
async function readStaticGtfsText(url, filename) {
  const key = (0, import_node_crypto.createHash)("sha256").update(`${url}:${filename}`).digest("hex");
  return cached(`nta-static-gtfs-text:${key}`, ttlMs, async () => zipText(new import_adm_zip.default(await readStaticGtfsZip(url)), filename));
}
async function readStaticGtfsZip(url) {
  const cachePath = staticGtfsCachePath(url);
  if (await isFreshCacheEntry(cachePath)) return await (0, import_promises2.readFile)(cachePath);
  const response = await fetch(url, { headers: { accept: "application/zip, application/octet-stream" } });
  if (!response.ok) throw new Error(`NTA static GTFS responded ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await (0, import_promises2.mkdir)(cacheDirectory(), { recursive: true });
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  await (0, import_promises2.writeFile)(temporaryPath, buffer);
  await (0, import_promises2.rename)(temporaryPath, cachePath);
  return buffer;
}
async function isFreshCacheEntry(path) {
  try {
    const details = await (0, import_promises2.stat)(path);
    return Date.now() - details.mtimeMs < ttlMs;
  } catch {
    return false;
  }
}
function staticGtfsCachePath(url) {
  const hash = (0, import_node_crypto.createHash)("sha256").update(url).digest("hex").slice(0, 16);
  return (0, import_node_path2.join)(cacheDirectory(), `nta-static-gtfs-${hash}.zip`);
}
function cacheDirectory() {
  return process.env.ATLASOPS_CACHE_DIR?.trim() || (0, import_node_path2.join)(process.cwd(), ".atlasops-cache");
}
function zipText(zip, name) {
  const entry = zip.getEntry(name);
  if (!entry) return "";
  return entry.getData().toString("utf8");
}
function parseCsv(text) {
  const rows = parseCsvRows(text);
  const headers = rows.shift();
  if (!headers) return [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}
function parseOptionalNumber(value) {
  if (!value) return void 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : void 0;
}
function parseGtfsTime(value) {
  if (!value) return void 0;
  const [hours, minutes, seconds] = value.split(":").map(Number);
  if (![hours, minutes, seconds].every(Number.isFinite)) return void 0;
  return hours * 3600 + minutes * 60 + seconds;
}
function routeSortLabel(route) {
  return route.shortName || route.longName || route.routeId;
}
function parseStopTimesForTrips(text, targetTripIds) {
  const stopTimesByTripId = /* @__PURE__ */ new Map();
  const lines = text.split(/\r?\n/);
  const headers = lines.shift()?.split(",") ?? [];
  const tripIdIndex = headers.indexOf("trip_id");
  const arrivalIndex = headers.indexOf("arrival_time");
  const departureIndex = headers.indexOf("departure_time");
  const stopIdIndex = headers.indexOf("stop_id");
  const stopSequenceIndex = headers.indexOf("stop_sequence");
  if (tripIdIndex < 0 || stopIdIndex < 0) return stopTimesByTripId;
  for (const line of lines) {
    if (!line) continue;
    const columns = line.split(",");
    const tripId = columns[tripIdIndex];
    if (!targetTripIds.has(tripId)) continue;
    const stopId = columns[stopIdIndex];
    if (!stopId) continue;
    const stopTimes = stopTimesByTripId.get(tripId) ?? [];
    stopTimes.push({
      tripId,
      stopId,
      arrivalSeconds: parseGtfsTime(columns[arrivalIndex]),
      departureSeconds: parseGtfsTime(columns[departureIndex]),
      stopSequence: parseOptionalNumber(columns[stopSequenceIndex])
    });
    stopTimesByTripId.set(tripId, stopTimes);
  }
  return stopTimesByTripId;
}
function parseStopServices(text, index, targetStopId) {
  const byStopId = /* @__PURE__ */ new Map();
  const rows = parse(text, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    on_record: (row) => row.stop_id === targetStopId ? row : null
  });
  for (const row of rows) {
    const tripId = row.trip_id;
    const stopId = row.stop_id;
    const arrivalSeconds = parseGtfsTime(row.arrival_time);
    if (!tripId || !stopId || arrivalSeconds === void 0) continue;
    const trip = index.tripsById.get(tripId);
    if (!trip) continue;
    const route = index.routesById.get(trip.routeId);
    const key = [trip.routeId, trip.directionId ?? "", trip.headsign ?? ""].join("|");
    const stopServices = byStopId.get(stopId) ?? /* @__PURE__ */ new Map();
    const service = stopServices.get(key) ?? {
      stopId,
      routeId: trip.routeId,
      routeShortName: route?.shortName,
      routeLongName: route?.longName,
      directionId: trip.directionId,
      headsign: trip.headsign,
      tripIds: [],
      arrivals: []
    };
    if (!service.tripIds.includes(tripId)) service.tripIds.push(tripId);
    service.arrivals.push({
      seconds: arrivalSeconds,
      tripId,
      stopSequence: parseOptionalNumber(row.stop_sequence)
    });
    stopServices.set(key, service);
    byStopId.set(stopId, stopServices);
  }
  const result = /* @__PURE__ */ new Map();
  for (const [stopId, services] of byStopId.entries()) {
    result.set(stopId, [...services.values()].map((service) => {
      service.arrivals.sort((left, right) => left.seconds - right.seconds);
      return service;
    }));
  }
  return result;
}
function nextScheduledStopService(service, nowSeconds) {
  const arrivals = service.arrivals ?? [];
  const nextArrival = arrivals.find((arrival) => arrival.seconds >= nowSeconds) ?? arrivals[0];
  return {
    stopId: service.stopId,
    routeId: service.routeId,
    routeShortName: service.routeShortName,
    routeLongName: service.routeLongName,
    directionId: service.directionId,
    headsign: service.headsign,
    tripIds: service.tripIds,
    scheduledArrivalSeconds: nextArrival?.seconds,
    scheduledTripId: nextArrival?.tripId,
    stopSequence: nextArrival?.stopSequence
  };
}
function parseShapesForShapeId(text, targetShapeId) {
  const points = [];
  const lines = text.split(/\r?\n/);
  const headers = lines.shift()?.split(",") ?? [];
  const shapeIdIndex = headers.indexOf("shape_id");
  const latitudeIndex = headers.indexOf("shape_pt_lat");
  const longitudeIndex = headers.indexOf("shape_pt_lon");
  const sequenceIndex = headers.indexOf("shape_pt_sequence");
  if (shapeIdIndex < 0 || latitudeIndex < 0 || longitudeIndex < 0 || sequenceIndex < 0) return points;
  for (const line of lines) {
    if (!line) continue;
    const columns = line.split(",");
    if (columns[shapeIdIndex] !== targetShapeId) continue;
    const latitude = parseOptionalNumber(columns[latitudeIndex]);
    const longitude = parseOptionalNumber(columns[longitudeIndex]);
    const sequence = parseOptionalNumber(columns[sequenceIndex]);
    if (latitude === void 0 || longitude === void 0 || sequence === void 0) continue;
    points.push({ latitude, longitude, sequence });
  }
  return points;
}

// server/providers/ntaGtfsRealtime/client.ts
var { transit_realtime } = import_gtfs_realtime_bindings.default;
var ttlMs2 = 25 * 1e3;
var candidateEndpoints = [
  "https://api.nationaltransport.ie/gtfsr/v2/Vehicles",
  "https://api.nationaltransport.ie/gtfsr/v2/VehiclePositions",
  "https://gtfsr.transportforireland.ie/v2/Vehicles",
  "https://gtfsr.transportforireland.ie/v2/VehiclePositions"
];
var candidateAlertEndpoints = [
  "https://api.nationaltransport.ie/gtfsr/v2/gtfsr?format=json",
  "https://api.nationaltransport.ie/gtfsr/v2/ServiceAlerts",
  "https://api.nationaltransport.ie/gtfsr/v2/Alerts",
  "https://gtfsr.transportforireland.ie/v2/ServiceAlerts",
  "https://gtfsr.transportforireland.ie/v2/Alerts"
];
var candidateTripUpdateEndpoints = [
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdates",
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdate",
  "https://gtfsr.transportforireland.ie/v2/TripUpdates",
  "https://gtfsr.transportforireland.ie/v2/TripUpdate"
];
var retryableStatuses = /* @__PURE__ */ new Set([429, 502, 503, 504]);
var scheduleEarlyThresholdSeconds = -90;
var scheduleLateThresholdSeconds = 300;
async function fetchNtaVehiclePositions() {
  return cached("nta-gtfs-realtime-vehicles", ttlMs2, async () => {
    const key = ntaApiKey();
    if (!key) return fixtureSnapshot();
    const errors = [];
    for (const endpoint of endpointsFromEnv()) {
      try {
        const vehicles = await enrichVehicles(await fetchVehicleEndpoint(endpoint, key), await fetchTripUpdatesBestEffort(key));
        return { vehicles, source: "live", fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
      } catch (error) {
        errors.push(`${endpoint}: ${errorSummary(error)}`);
      }
    }
    throw new Error(`NTA GTFS-Realtime vehicle feed failed. ${errors.join(" | ")}`);
  });
}
async function fetchNtaServiceAlerts() {
  return cached("nta-gtfs-realtime-alerts", 60 * 1e3, async () => {
    const key = ntaApiKey();
    if (!key) return fixtureAlertSnapshot();
    const errors = [];
    for (const endpoint of alertEndpointsFromEnv()) {
      try {
        const alerts = await enrichAlerts(await fetchAlertEndpoint(endpoint, key));
        return { alerts, source: "live", fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
      } catch (error) {
        errors.push(`${endpoint}: ${errorSummary(error)}`);
      }
    }
    throw new Error(`NTA GTFS-Realtime alerts feed failed. ${errors.join(" | ")}`);
  });
}
async function ntaDiagnostics() {
  const keyInfo = ntaApiKeyInfo();
  const effectiveStaticGtfsUrl = staticGtfsUrl();
  let staticGtfs;
  let recommendedStaticGtfs;
  try {
    const index = await fetchStaticGtfsIndex();
    staticGtfs = {
      configured: Boolean(process.env.NTA_GTFS_STATIC_URL?.trim()),
      defaultRecommended: !process.env.NTA_GTFS_STATIC_URL?.trim() && effectiveStaticGtfsUrl === recommendedStaticGtfsUrl,
      source: index.source,
      routeCount: index.routesById.size,
      tripCount: index.tripsById.size,
      agencyCount: index.agenciesById.size,
      stopCount: index.stopsById.size
    };
  } catch (error) {
    staticGtfs = {
      configured: Boolean(process.env.NTA_GTFS_STATIC_URL?.trim()),
      defaultRecommended: !process.env.NTA_GTFS_STATIC_URL?.trim() && effectiveStaticGtfsUrl === recommendedStaticGtfsUrl,
      source: "unavailable",
      error: error instanceof Error ? error.message : "Static GTFS check failed"
    };
  }
  try {
    recommendedStaticGtfs = await probeRecommendedStaticGtfs();
  } catch (error) {
    recommendedStaticGtfs = {
      url: recommendedStaticGtfsUrl,
      reachable: false,
      error: error instanceof Error ? error.message : "Recommended static GTFS probe failed"
    };
  }
  return {
    realtime: {
      keyConfigured: keyInfo.configured,
      keyEnvName: keyInfo.envName,
      mode: keyInfo.configured ? "live" : "fixture",
      vehicleEndpointOverride: Boolean(process.env.NTA_VEHICLE_POSITIONS_URL?.trim()),
      serviceAlertEndpointOverride: Boolean(process.env.NTA_SERVICE_ALERTS_URL?.trim()),
      tripUpdateEndpointOverride: Boolean(process.env.NTA_TRIP_UPDATES_URL?.trim()),
      vehicleEndpoints: endpointsFromEnv(),
      serviceAlertEndpoints: alertEndpointsFromEnv(),
      tripUpdateEndpoints: tripUpdateEndpointsFromEnv()
    },
    staticGtfs,
    recommendedStaticGtfs
  };
}
function endpointsFromEnv() {
  const configured = process.env.NTA_VEHICLE_POSITIONS_URL?.trim();
  return configured ? [configured] : candidateEndpoints;
}
function alertEndpointsFromEnv() {
  const configured = process.env.NTA_SERVICE_ALERTS_URL?.trim();
  return configured ? [configured] : candidateAlertEndpoints;
}
function tripUpdateEndpointsFromEnv() {
  const configured = process.env.NTA_TRIP_UPDATES_URL?.trim();
  return configured ? [configured] : candidateTripUpdateEndpoints;
}
function ntaApiKey() {
  return ntaApiKeyInfo().value;
}
function ntaApiKeyInfo() {
  const candidates = [
    ["NTA_API_KEY", process.env.NTA_API_KEY],
    ["NTA_GTFSR_API_KEY", process.env.NTA_GTFSR_API_KEY],
    ["TFI_API_KEY", process.env.TFI_API_KEY]
  ];
  const match = candidates.find(([, value]) => value?.trim());
  return {
    configured: Boolean(match),
    envName: match?.[0],
    value: match?.[1]?.trim()
  };
}
async function fetchVehicleEndpoint(endpoint, key) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      "Cache-Control": "no-cache",
      "Ocp-Apim-Subscription-Key": key,
      "x-api-key": key
    }
  });
  if (!response.ok) throw new Error(`responded ${response.status}`);
  const buffer = new Uint8Array(await response.arrayBuffer());
  const feed = transit_realtime.FeedMessage.decode(buffer);
  return feed.entity.flatMap((entity) => {
    const vehicle = entity.vehicle;
    const position = vehicle?.position;
    if (!vehicle || !position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) return [];
    return [{
      id: entity.id,
      vehicleId: optionalString(vehicle.vehicle?.id),
      label: optionalString(vehicle.vehicle?.label),
      licensePlate: optionalString(vehicle.vehicle?.licensePlate),
      tripId: optionalString(vehicle.trip?.tripId),
      routeId: optionalString(vehicle.trip?.routeId),
      startTime: optionalString(vehicle.trip?.startTime),
      startDate: optionalString(vehicle.trip?.startDate),
      latitude: position.latitude,
      longitude: position.longitude,
      bearing: finiteNumber(position.bearing),
      speed: finiteNumber(position.speed),
      timestamp: finiteNumber(vehicle.timestamp),
      currentStopSequence: finiteNumber(vehicle.currentStopSequence),
      stopId: optionalString(vehicle.stopId),
      currentStatus: vehicle.currentStatus === void 0 ? void 0 : String(vehicle.currentStatus),
      congestionLevel: vehicle.congestionLevel === void 0 ? void 0 : String(vehicle.congestionLevel),
      occupancyStatus: vehicle.occupancyStatus === void 0 ? void 0 : String(vehicle.occupancyStatus)
    }];
  });
}
async function fetchAlertEndpoint(endpoint, key) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      "Cache-Control": "no-cache",
      "Ocp-Apim-Subscription-Key": key,
      "x-api-key": key
    }
  });
  if (!response.ok) throw new Error(`responded ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return normalizeJsonAlerts(await response.json());
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  const feed = transit_realtime.FeedMessage.decode(buffer);
  return feed.entity.flatMap((entity) => {
    const alert = entity.alert;
    if (!alert) return [];
    return [{
      id: entity.id,
      cause: alert.cause === void 0 ? void 0 : String(alert.cause),
      effect: alert.effect === void 0 ? void 0 : String(alert.effect),
      header: translatedText(alert.headerText),
      description: translatedText(alert.descriptionText),
      url: translatedText(alert.url),
      activePeriods: (alert.activePeriod ?? []).map((period) => ({
        start: finiteNumber(period.start),
        end: finiteNumber(period.end)
      })),
      routeIds: (alert.informedEntity ?? []).flatMap((entity2) => presentString(entity2.routeId)),
      stopIds: (alert.informedEntity ?? []).flatMap((entity2) => presentString(entity2.stopId)),
      tripIds: (alert.informedEntity ?? []).flatMap((entity2) => presentString(entity2.trip?.tripId))
    }];
  });
}
async function fetchTripUpdatesBestEffort(key) {
  const errors = [];
  for (const endpoint of tripUpdateEndpointsFromEnv()) {
    try {
      return await fetchTripUpdateEndpoint(endpoint, key);
    } catch (error) {
      errors.push(`${endpoint}: ${errorSummary(error)}`);
    }
  }
  return [];
}
async function fetchTripUpdateEndpoint(endpoint, key) {
  const response = await fetchWithRetry(endpoint, {
    headers: {
      "Cache-Control": "no-cache",
      "Ocp-Apim-Subscription-Key": key,
      "x-api-key": key
    }
  });
  if (!response.ok) throw new Error(`responded ${response.status}`);
  const buffer = new Uint8Array(await response.arrayBuffer());
  const feed = transit_realtime.FeedMessage.decode(buffer);
  return feed.entity.flatMap((entity) => {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate) return [];
    const stopUpdate = (tripUpdate.stopTimeUpdate ?? []).find((update) => {
      const delay = finiteNumber(update.arrival?.delay) ?? finiteNumber(update.departure?.delay);
      return delay !== void 0;
    }) ?? tripUpdate.stopTimeUpdate?.[0];
    return [{
      id: entity.id,
      tripId: optionalString(tripUpdate.trip?.tripId),
      routeId: optionalString(tripUpdate.trip?.routeId),
      vehicleId: optionalString(tripUpdate.vehicle?.id),
      timestamp: finiteNumber(tripUpdate.timestamp),
      delay: finiteNumber(stopUpdate?.arrival?.delay) ?? finiteNumber(stopUpdate?.departure?.delay),
      arrivalTime: finiteNumber(stopUpdate?.arrival?.time),
      departureTime: finiteNumber(stopUpdate?.departure?.time),
      stopId: optionalString(stopUpdate?.stopId),
      stopSequence: finiteNumber(stopUpdate?.stopSequence)
    }];
  });
}
async function fetchWithRetry(endpoint, init, attempts = 2) {
  let latest;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    latest = await fetch(endpoint, init);
    if (!retryableStatuses.has(latest.status) || attempt === attempts - 1) return latest;
    await sleep(retryDelayMs(latest));
  }
  return latest;
}
function retryDelayMs(response) {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1e3, 5e3);
  return 5e3;
}
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
function normalizeJsonAlerts(feed) {
  if (!isRecord2(feed) || !Array.isArray(feed.entity)) return [];
  return feed.entity.flatMap((entity) => {
    if (!isRecord2(entity)) return [];
    const alert = recordValue(entity, "alert");
    if (!isRecord2(alert)) return [];
    const activePeriods = arrayValue(alert, "activePeriod", "active_period").map((period) => isRecord2(period) ? {
      start: finiteNumber(recordValue(period, "start")),
      end: finiteNumber(recordValue(period, "end"))
    } : {});
    const informedEntities = arrayValue(alert, "informedEntity", "informed_entity");
    return [{
      id: stringValue3(recordValue(entity, "id")) ?? crypto.randomUUID(),
      cause: stringValue3(recordValue(alert, "cause")),
      effect: stringValue3(recordValue(alert, "effect")),
      header: translatedJsonText(recordValue(alert, "headerText", "header_text")),
      description: translatedJsonText(recordValue(alert, "descriptionText", "description_text")),
      url: translatedJsonText(recordValue(alert, "url")),
      activePeriods,
      routeIds: informedEntities.flatMap((item) => isRecord2(item) ? presentString(stringValue3(recordValue(item, "routeId", "route_id"))) : []),
      stopIds: informedEntities.flatMap((item) => isRecord2(item) ? presentString(stringValue3(recordValue(item, "stopId", "stop_id"))) : []),
      tripIds: informedEntities.flatMap((item) => {
        if (!isRecord2(item)) return [];
        const trip = recordValue(item, "trip");
        return isRecord2(trip) ? presentString(stringValue3(recordValue(trip, "tripId", "trip_id"))) : [];
      })
    }];
  });
}
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function optionalString(value) {
  return value?.trim() ? value : void 0;
}
function translatedText(value) {
  return value?.translation?.find((translation) => translation.text)?.text ?? void 0;
}
function presentString(value) {
  return value ? [value] : [];
}
function errorSummary(error) {
  if (!(error instanceof Error)) return "unknown error";
  const cause = error.cause;
  if (isRecord2(cause)) {
    const code = stringValue3(recordValue(cause, "code"));
    const hostname = stringValue3(recordValue(cause, "hostname"));
    if (code && hostname) return `${error.message} (${code} ${hostname})`;
    if (code) return `${error.message} (${code})`;
  }
  return error.message;
}
function translatedJsonText(value) {
  if (!isRecord2(value)) return void 0;
  const translations = arrayValue(value, "translation");
  for (const translation of translations) {
    if (!isRecord2(translation)) continue;
    const text = stringValue3(recordValue(translation, "text"));
    if (text) return text;
  }
  return void 0;
}
function recordValue(record, ...keys) {
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return void 0;
}
function arrayValue(record, ...keys) {
  const value = recordValue(record, ...keys);
  return Array.isArray(value) ? value : [];
}
function stringValue3(value) {
  return typeof value === "string" ? value : void 0;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}
function fixtureSnapshot() {
  const now = /* @__PURE__ */ new Date();
  const timestamp = Math.floor(now.getTime() / 1e3);
  const vehicles = [
    { id: "fixture-46a-1", vehicleId: "TFI-FIX-46A-1", label: "46A", routeId: "46A", routeShortName: "46A", routeLongName: "Dun Laoghaire - Phoenix Park", agencyName: "Fixture Transit", tripId: "fixture-trip-46a", tripHeadsign: "Phoenix Park", latitude: 53.3438, longitude: -6.2546, bearing: 320, speed: 7.2, timestamp, scheduleStatus: "late", scheduleDeviationSeconds: 420, scheduleSource: "gtfs-realtime-trip-update", nextStopName: "Leeson Street Lower", staticGtfsSource: "unavailable" },
    { id: "fixture-145-1", vehicleId: "TFI-FIX-145-1", label: "145", routeId: "145", routeShortName: "145", routeLongName: "Heuston Station - Kilmacanogue", agencyName: "Fixture Transit", tripId: "fixture-trip-145", tripHeadsign: "Heuston Station", latitude: 53.3337, longitude: -6.2488, bearing: 28, speed: 6.4, timestamp, scheduleStatus: "on-time", scheduleDeviationSeconds: 45, scheduleSource: "gtfs-realtime-trip-update", nextStopName: "Dawson Street", staticGtfsSource: "unavailable" },
    { id: "fixture-g1-1", vehicleId: "TFI-FIX-G1-1", label: "G1", routeId: "G1", routeShortName: "G1", routeLongName: "Spencer Dock - Red Cow Luas", agencyName: "Fixture Transit", tripId: "fixture-trip-g1", tripHeadsign: "Spencer Dock", latitude: 53.3489, longitude: -6.3037, bearing: 92, speed: 8.1, timestamp, scheduleStatus: "early", scheduleDeviationSeconds: -180, scheduleSource: "gtfs-realtime-trip-update", nextStopName: "Inchicore", staticGtfsSource: "unavailable" },
    { id: "fixture-15-1", vehicleId: "TFI-FIX-15-1", label: "15", routeId: "15", routeShortName: "15", routeLongName: "Clongriffin - Ballycullen Road", agencyName: "Fixture Transit", tripId: "fixture-trip-15", tripHeadsign: "Clongriffin", latitude: 53.3172, longitude: -6.2658, bearing: 354, speed: 5.8, timestamp, scheduleStatus: "unknown", scheduleSource: "unavailable", staticGtfsSource: "unavailable" }
  ];
  return { vehicles, source: "fixture", fetchedAt: now.toISOString() };
}
function fixtureAlertSnapshot() {
  const now = /* @__PURE__ */ new Date();
  const start = Math.floor((now.getTime() - 30 * 60 * 1e3) / 1e3);
  const end = Math.floor((now.getTime() + 2 * 60 * 60 * 1e3) / 1e3);
  return {
    source: "fixture",
    fetchedAt: now.toISOString(),
    alerts: [{
      id: "fixture-alert-route-46a",
      cause: "UNKNOWN_CAUSE",
      effect: "SIGNIFICANT_DELAYS",
      header: "Fixture delay on route 46A",
      description: "Fixture GTFS-Realtime alert used when no NTA API key is configured.",
      activePeriods: [{ start, end }],
      routeIds: ["46A"],
      stopIds: [],
      tripIds: ["fixture-trip-46a"],
      staticGtfsSource: "unavailable"
    }]
  };
}
async function enrichVehicles(vehicles, tripUpdates = []) {
  let staticIndex;
  try {
    staticIndex = await fetchStaticGtfsIndex();
  } catch {
    return vehicles.map((vehicle) => enrichVehicleSchedule(vehicle, tripUpdates));
  }
  const staticFallbackStopTimes = await fetchStaticGtfsStopTimes(vehicles.flatMap((vehicle) => {
    if (!vehicle.tripId) return [];
    return findTripUpdate(vehicle, tripUpdates)?.delay === void 0 ? [vehicle.tripId] : [];
  }));
  return vehicles.map((vehicle) => {
    const trip = vehicle.tripId ? staticIndex.tripsById.get(vehicle.tripId) : void 0;
    const routeId = vehicle.routeId ?? trip?.routeId;
    const route = routeId ? staticIndex.routesById.get(routeId) : void 0;
    const agency = route?.agencyId ? staticIndex.agenciesById.get(route.agencyId) : staticIndex.agenciesById.get("default");
    return {
      ...vehicle,
      routeId,
      routeShortName: route?.shortName,
      routeType: route?.routeType,
      routeLongName: route?.longName,
      agencyName: agency?.name,
      tripHeadsign: trip?.headsign,
      directionId: trip?.directionId,
      staticGtfsSource: staticIndex.source,
      ...scheduleAdherence(vehicle, tripUpdates, staticIndex, staticFallbackStopTimes)
    };
  });
}
async function enrichAlerts(alerts) {
  let staticIndex;
  try {
    staticIndex = await fetchStaticGtfsIndex();
  } catch {
    return alerts.map((alert) => ({ ...alert, staticGtfsSource: "unavailable" }));
  }
  return alerts.map((alert) => {
    const stop = alert.stopIds.map((stopId) => staticIndex.stopsById.get(stopId)).find(Boolean);
    return {
      ...alert,
      stopName: stop?.name,
      latitude: stop?.latitude,
      longitude: stop?.longitude,
      staticGtfsSource: staticIndex.source
    };
  });
}
function enrichVehicleSchedule(vehicle, tripUpdates) {
  return {
    ...vehicle,
    staticGtfsSource: "unavailable",
    ...scheduleAdherence(vehicle, tripUpdates)
  };
}
function scheduleAdherence(vehicle, tripUpdates, staticIndex, staticStopTimes = /* @__PURE__ */ new Map()) {
  const tripUpdate = findTripUpdate(vehicle, tripUpdates);
  if (tripUpdate?.delay !== void 0) {
    return {
      scheduleStatus: scheduleStatusForDeviation(tripUpdate.delay),
      scheduleDeviationSeconds: Math.round(tripUpdate.delay),
      scheduleSource: "gtfs-realtime-trip-update",
      nextStopId: tripUpdate.stopId,
      nextStopName: tripUpdate.stopId ? staticIndex?.stopsById.get(tripUpdate.stopId)?.name : void 0,
      providerArrival: tripUpdate.arrivalTime ? new Date(tripUpdate.arrivalTime * 1e3).toISOString() : void 0
    };
  }
  const estimate = staticIndex ? estimateStaticScheduleAdherence(vehicle, staticIndex, staticStopTimes) : void 0;
  if (estimate) return estimate;
  return {
    scheduleStatus: "unknown",
    scheduleSource: "unavailable"
  };
}
function findTripUpdate(vehicle, tripUpdates) {
  if (!tripUpdates.length) return void 0;
  return tripUpdates.find((update) => vehicle.tripId && update.tripId === vehicle.tripId) ?? tripUpdates.find((update) => vehicle.vehicleId && update.vehicleId === vehicle.vehicleId) ?? tripUpdates.find((update) => vehicle.routeId && vehicle.tripId && update.routeId === vehicle.routeId && update.tripId === vehicle.tripId);
}
function estimateStaticScheduleAdherence(vehicle, staticIndex, staticStopTimes) {
  if (!vehicle.tripId || vehicle.timestamp === void 0) return void 0;
  const stopTimes = staticStopTimes.get(vehicle.tripId);
  if (!stopTimes?.length) return void 0;
  const matchedStopTime = scheduledStopFromRealtimeVehicle(vehicle, stopTimes);
  const nearest = matchedStopTime ? scheduledStopWithDistance(vehicle, matchedStopTime, staticIndex) : nearestScheduledStop(vehicle, stopTimes, staticIndex);
  const maximumDistanceMeters = matchedStopTime ? 2500 : 450;
  if (!nearest || nearest.distanceMeters > maximumDistanceMeters) return void 0;
  const scheduledSeconds = nearest.stopTime.departureSeconds ?? nearest.stopTime.arrivalSeconds;
  if (scheduledSeconds === void 0) return void 0;
  const observedSeconds = serviceDaySeconds(vehicle.timestamp);
  const deviation = normalizeDeviationSeconds(observedSeconds - scheduledSeconds);
  return {
    scheduleStatus: scheduleStatusForDeviation(deviation),
    scheduleDeviationSeconds: Math.round(deviation),
    scheduleSource: "static-gtfs-estimate",
    nextStopId: nearest.stopTime.stopId,
    nextStopName: nearest.stop?.name
  };
}
function scheduledStopFromRealtimeVehicle(vehicle, stopTimes) {
  if (vehicle.stopId) {
    const byStopId = stopTimes.find((stopTime) => stopTime.stopId === vehicle.stopId);
    if (byStopId) return byStopId;
  }
  if (vehicle.currentStopSequence !== void 0) {
    return stopTimes.find((stopTime) => stopTime.stopSequence === vehicle.currentStopSequence);
  }
  return void 0;
}
function scheduledStopWithDistance(vehicle, stopTime, staticIndex) {
  const stop = staticIndex.stopsById.get(stopTime.stopId);
  const distanceMeters = stop ? haversineMeters(vehicle.latitude, vehicle.longitude, stop.latitude, stop.longitude) : 0;
  return { stopTime, stop, distanceMeters };
}
function nearestScheduledStop(vehicle, stopTimes, staticIndex) {
  let nearest;
  for (const stopTime of stopTimes) {
    const stop = staticIndex.stopsById.get(stopTime.stopId);
    if (!stop) continue;
    const distanceMeters = haversineMeters(vehicle.latitude, vehicle.longitude, stop.latitude, stop.longitude);
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = { stopTime, stop, distanceMeters };
    }
  }
  return nearest;
}
function scheduleStatusForDeviation(seconds) {
  if (seconds <= scheduleEarlyThresholdSeconds) return "early";
  if (seconds >= scheduleLateThresholdSeconds) return "late";
  return "on-time";
}
function serviceDaySeconds(timestamp) {
  const observed = new Date(timestamp * 1e3);
  return observed.getHours() * 3600 + observed.getMinutes() * 60 + observed.getSeconds();
}
function normalizeDeviationSeconds(seconds) {
  if (seconds > 12 * 3600) return seconds - 24 * 3600;
  if (seconds < -12 * 3600) return seconds + 24 * 3600;
  return seconds;
}
function haversineMeters(fromLatitude, fromLongitude, toLatitude, toLongitude) {
  const earthRadiusMeters = 6371e3;
  const deltaLatitude = degreesToRadians(toLatitude - fromLatitude);
  const deltaLongitude = degreesToRadians(toLongitude - fromLongitude);
  const fromRadians = degreesToRadians(fromLatitude);
  const toRadians = degreesToRadians(toLatitude);
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(fromRadians) * Math.cos(toRadians) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function degreesToRadians(value) {
  return value * Math.PI / 180;
}

// server/providers/ntaGtfsRealtime/routes.ts
function ntaGtfsRealtimeRoutes() {
  return async (request, response, next) => {
    const url = new URL(request.url ?? "/", "http://atlasops.local");
    if (!url.pathname.startsWith("/api/providers/nta/")) return next();
    let bounds;
    try {
      bounds = parseBounds(url.searchParams.get("bounds"));
    } catch (error) {
      sendJson(response, 400, { error: error.message });
      return;
    }
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (url.pathname === "/api/providers/nta/diagnostics") {
      try {
        sendJson(response, 200, {
          diagnostics: await ntaDiagnostics(),
          checkedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : "NTA diagnostics failed" });
      }
      return;
    }
    if (url.pathname === "/api/providers/nta/alerts") {
      try {
        const snapshot = await fetchNtaServiceAlerts();
        sendJson(response, 200, {
          collection: adaptNtaServiceAlerts(snapshot.alerts.filter((alert) => {
            const routeIds = url.searchParams.getAll("routeId");
            const tripId = url.searchParams.get("tripId");
            const stopId = url.searchParams.get("stopId");
            return routeIds.some((id) => alert.routeIds.includes(id)) || Boolean(tripId && alert.tripIds.includes(tripId)) || Boolean(stopId && alert.stopIds.includes(stopId));
          }), snapshot.source),
          source: snapshot.source,
          syncedAt: snapshot.fetchedAt
        });
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA GTFS-Realtime alerts request failed" });
      }
      return;
    }
    if (url.pathname === "/api/providers/nta/routes") {
      try {
        const routes = query ? await fetchStaticGtfsRouteOptions(bounds) : { source: "unavailable", routes: [] };
        sendJson(response, 200, {
          ...routes,
          routes: query ? routes.routes.filter((route) => matchesQuery(query, [route.routeId, route.shortName, route.longName, route.operator, ...route.headsigns])).slice(0, queryLimit(url.searchParams.get("limit"))) : [],
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA static GTFS route index request failed" });
      }
      return;
    }
    if (url.pathname === "/api/providers/nta/stops") {
      try {
        const stops = query || bounds ? await fetchStaticGtfsStopOptions() : { source: "unavailable", stops: [] };
        sendJson(response, 200, {
          source: stops.source,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
          collection: {
            type: "FeatureCollection",
            features: stops.stops.filter((stop) => (query || bounds) && insideBounds(stop.longitude, stop.latitude, bounds) && matchesQuery(query, [stop.stopId, stop.name])).slice(0, queryLimit(url.searchParams.get("limit"), query ? 30 : 200)).map((stop) => ({
              type: "Feature",
              id: `nta-stop:${stop.stopId}`,
              geometry: {
                type: "Point",
                coordinates: [stop.longitude, stop.latitude]
              },
              properties: {
                id: `nta-stop:${stop.stopId}`,
                provider: "nta-gtfs-realtime",
                providerName: "NTA GTFS Static",
                stopId: stop.stopId,
                name: stop.name || `Stop ${stop.stopId}`,
                sourceProperties: {
                  source: stops.source
                }
              }
            }))
          }
        });
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA static GTFS stops request failed" });
      }
      return;
    }
    if (url.pathname === "/api/providers/nta/trip-context") {
      const tripId = url.searchParams.get("tripId")?.trim();
      if (!tripId) {
        sendJson(response, 400, { error: "tripId is required" });
        return;
      }
      try {
        sendJson(response, 200, {
          context: await fetchStaticGtfsTripContext(tripId),
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA static GTFS trip context request failed" });
      }
      return;
    }
    if (url.pathname === "/api/providers/nta/stop-services") {
      const stopId = url.searchParams.get("stopId")?.trim();
      const routeIds = url.searchParams.getAll("routeId").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
      if (!stopId) {
        sendJson(response, 400, { error: "stopId is required" });
        return;
      }
      try {
        const services = await fetchStaticGtfsStopServices(stopId, routeIds);
        sendJson(response, 200, {
          ...services,
          syncedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA static GTFS stop service request failed" });
      }
      return;
    }
    if (url.pathname !== "/api/providers/nta/vehicles") {
      next();
      return;
    }
    try {
      const snapshot = await fetchNtaVehiclePositions();
      const collection = adaptNtaVehicles(snapshot.vehicles, snapshot.source);
      const stopId = url.searchParams.get("stopId");
      const stopTrips = stopId ? new Set((await fetchStaticGtfsStopServices(stopId, [])).services.flatMap((service) => service.tripIds)) : void 0;
      if (stopTrips) await fetchStaticGtfsStopTimes(collection.features.filter((vehicle) => stopTrips.has(vehicle.properties.tripId ?? "")).map((vehicle) => vehicle.properties.tripId));
      let history;
      try {
        history = await recordVehicleSnapshot(collection, snapshot.source, snapshot.fetchedAt);
      } catch (error) {
        history = { error: error instanceof Error ? error.message : "Vehicle observation recording failed" };
      }
      sendJson(response, 200, {
        collection: {
          ...collection,
          features: collection.features.filter((vehicle) => vehicle.properties.assetType === "bus" && (!stopTrips || stopTrips.has(vehicle.properties.tripId ?? "")) && insideBounds(vehicle.geometry.coordinates[0], vehicle.geometry.coordinates[1], bounds) && (!url.searchParams.has("routeId") || url.searchParams.getAll("routeId").includes(vehicle.properties.routeId ?? "")))
        },
        source: snapshot.source,
        syncedAt: snapshot.fetchedAt,
        history
      });
    } catch (error) {
      sendJson(response, 502, { error: error instanceof Error ? error.message : "NTA GTFS-Realtime request failed" });
    }
  };
}

// api/_handler.ts
var middlewares = [
  transportRoutes(),
  ntaGtfsRealtimeRoutes()
];
async function handler(request, response) {
  for (const middleware of middlewares) {
    await middleware(request, response, () => {
    });
    if (response.writableEnded) return;
  }
  sendJson(response, 404, { error: "Not found" });
}
/*! Bundled license information:

long/umd/index.js:
  (**
   * @license
   * Copyright 2009 The Closure Library Authors
   * Copyright 2020 Daniel Wirtz / The long.js Authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * SPDX-License-Identifier: Apache-2.0
   *)
*/
