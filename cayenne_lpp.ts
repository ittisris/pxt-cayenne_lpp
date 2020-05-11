/**
 ***********************************************************************
 * Cayenne LPP
 * https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
 * 
 * Itti Srisumalai: 2019
 */

const enum LPP_DATA_TYPE {
	//% block="Digital Input"
	Digital_Input = 0,
	//% block="Digital Output"
	Digital_Output = 1,
	//% block="Analog Input"
	Analog_Input = 2,
	//% block="Analog Output"
	Analog_Output = 3,
	//% block="Temperature"
	Temperature = 0x67,
	//% block="Humidity"
	Humidity = 0x68,
	//% block="Pressure"
	Pressure = 0x73
};

const enum LPP_Bit_Sensor {
	//% block="Temparature Sensor"
	Temperature = 21,
	//% block="Light Level"
	Light = 22,
	//% block="LED Brightness"
	LED_Brightness = 23,
};

const enum LPP_Direction {
	//% block="Input"
	Input_Port = 0,
	//% block="Output"
	Output_Port = 1,
};

//% color=#75b233 icon="\uf085" weight=96
namespace cayenneLPP {

	const LPP_Pin_Chan: number[] = [-1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20]

	//%
	function getchan(id: number): number {
		switch (id) {
			case LPP_Bit_Sensor.Temperature: return LPP_Bit_Sensor.Temperature
			case LPP_Bit_Sensor.Light: return LPP_Bit_Sensor.Light
			case LPP_Bit_Sensor.LED_Brightness: return LPP_Bit_Sensor.LED_Brightness
			default:
				return LPP_Pin_Chan[id]
		}
	}

	//%
	function getid(ch: number): number {
		switch (ch) {
			case LPP_Bit_Sensor.Temperature: return LPP_Bit_Sensor.Temperature
			case LPP_Bit_Sensor.Light: return LPP_Bit_Sensor.Light
			case LPP_Bit_Sensor.LED_Brightness: return LPP_Bit_Sensor.LED_Brightness
			default:
				return LPP_Pin_Chan.indexOf(ch)
		}
	}

	class cayenneLPP {
		id: number
		channel: number
		ctype: number
		value: number

		constructor(id: number, ctype: LPP_DATA_TYPE) {
			this.id = id
			this.channel = getchan(id)
			this.ctype = ctype

			switch (id) {
				case LPP_Bit_Sensor.LED_Brightness:
					this.value = led.brightness()
					break
				default:
					this.value = 0
			}
		}
	}

	const LPP_PIN_MAX = 5
	let LPP_Temparature: cayenneLPP = null
	let LPP_Light: cayenneLPP = null
	let LPP_Brightness: cayenneLPP = null
	let LPP_Pin_0: cayenneLPP = null
	let LPP_Pin: cayenneLPP[] = []

	//%
	function byteToHexString(value: number): string {
		let v: number = value % 256
		return (("0123456789ABCDEF"[v >> 4]) + ("0123456789ABCDEF"[v & 0xF]))
	}

	//%
	function intToHexString(value: number): string {
		let v: number = value % 65536
		return (byteToHexString(v >> 8) + byteToHexString(v & 0xFF))
	}

	function HexStringToByte(text: string): number {
		let n = 0
		let h = 0

		if (text.length > 0) {
			h = text.charCodeAt(0)

			if ((h >= 48) && (h <= 57))         //'0' - '9'
				n = h - 48
			else if ((h >= 65) && (h <= 70))    //'A' - 'F'
				n = h - 55
			else if ((h >= 97) && (h <= 102))   //'a' - 'f'
				n = h - 87
			else
				n = 0
		}

		if (text.length > 1) {
			h = text.charCodeAt(1)

			if ((h >= 48) && (h <= 57))         //'0' - '9'
				n = (n * 16) + (h - 48)
			else if ((h >= 65) && (h <= 70))    //'A' - 'F'
				n = (n * 16) + (h - 55)
			else if ((h >= 97) && (h <= 102))   //'a' - 'f'
				n = (n * 16) + (h - 87)
			else
				n = n * 16
		}

		return n
	}

	function HexStringToBuf(text: string): Buffer {
		let boffset = text.length % 2
		let len = (text.length / 2) + boffset
		let temp = pins.createBuffer(len)

		let b = 0
		let h = 0
		let offset = 0
		let v = 0

		for (let i = 0; i < text.length; i++) {
			h = text.charCodeAt(i)

			if ((h >= 48) && (h <= 57))         //'0' - '9'
				offset = 48
			else if ((h >= 65) && (h <= 70))    //'A' - 'F'
				offset = 55
			else if ((h >= 97) && (h <= 102))   //'a' - 'f'
				offset = 87
			else
				offset = h

			if (((i + boffset) % 2) != 0) {
				temp[b] = v | (h - offset)  //temp.setNumber(NumberFormat.UInt8LE, b, v | (h - offset));
				b++;
			} else
				v = (h - offset) << 4
		}
		return temp
	}

	/**
	* Convert to Cayenne Low-Powered Payload (Hexstring) https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
	* @param llpType Cayenne LPP Type
	* @param channel LPP Channel from 1-255
	* @param value Number
	*/
	//% weight=90
	//% blockId="cayenneLPP_lpp"
	//% block="Convert to CayenneLPP|Type %llpType|at Channel %channel|with RawData %value"
	//% channel.defl=1
	//% channel.min=1 channel.max=253
	//% value.defl=1.0
	export function lpp(llpType: LPP_DATA_TYPE, channel: number, value: number, ratio = 1): string {
		let header = byteToHexString(channel) + byteToHexString(llpType)
		switch (llpType) {
			case LPP_DATA_TYPE.Digital_Input: return (header + (value <= 0 ? "00" : "01"))
			case LPP_DATA_TYPE.Digital_Output: return (header + (value <= 0 ? "00" : "01"))
			case LPP_DATA_TYPE.Analog_Input: return (header + intToHexString(Math.round(value * 100)))
			case LPP_DATA_TYPE.Analog_Output: return (header + intToHexString(Math.round(value * 100)))
			case LPP_DATA_TYPE.Temperature: return (header + intToHexString(Math.round(value * 10)))
			case LPP_DATA_TYPE.Humidity: return (header + byteToHexString(Math.round(value * 2)))
			case LPP_DATA_TYPE.Pressure: return (header + intToHexString(Math.round(value * 10)))
			default: return ""
		}
	}

	/**
	* Add Sensor 
	* @param sensor Sensortype
	*/
	//% weight=99
	//% blockId="cayenneLPP_add_sensor"
	//% block="Add %sensor"
	//% pin.defl=LPP_Bit_Sensor.Temperature
	export function add_sensor(sensor: LPP_Bit_Sensor): void {
		switch (sensor) {
			case LPP_Bit_Sensor.Temperature:
				LPP_Temparature = new cayenneLPP(sensor, LPP_DATA_TYPE.Temperature)
				if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
				LPP_Pin.push(LPP_Temparature)
				break

			case LPP_Bit_Sensor.Light:
				LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Input)
				if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
				LPP_Pin.push(LPP_Light)
				break

			case LPP_Bit_Sensor.LED_Brightness:
				LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Output)
				if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
				LPP_Pin.push(LPP_Light)
				break
		}
	}

	/**
	* Add Digital Pin to CayenneLLP
	* @param pin DigitalPin
	*/
	//% weight=100
	//% blockId="cayenneLPP_add_digital"
	//% block="Add Digital %dir|Pin %pin"
	//% pin.defl=DigitalPin.P0
	export function add_digital(dir: LPP_Direction, pin: DigitalPin): void {
		if (dir == LPP_Direction.Input_Port)
			LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Digital_Input)
		else
			LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Digital_Output)

		if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
		LPP_Pin.push(LPP_Pin_0)
	}

	/**
	* Add Analog Pin to CayenneLLP
	* @param pin AnologPin
	*/
	//% weight=100
	//% blockId="cayenneLPP_add_analog"
	//% block="Add Analog %dir|Pin %pin"
	//% pin.defl=AnalogPin.P0
	export function add_analog(dir: LPP_Direction, pin: AnalogPin): void {
		if (dir == LPP_Direction.Input_Port)
			LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Input)
		else
			LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Output)

		if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
		LPP_Pin.push(LPP_Pin_0)
	}

	/**
	* Read & Pack I/O to CayenneLPP
	* @param no
	*/
	//% weight=98
	//% blockId="cayenneLPP_lpp_upload"
	//% block="CayenneLPP"
	export function lpp_upload(): string {
		let payload = ""
		for (let c = 0; c < LPP_Pin.length; c++) {
			switch (LPP_Pin[c].id) {
				case LPP_Bit_Sensor.Temperature:
					LPP_Pin[c].value = input.temperature()  // celsius
					break
				case LPP_Bit_Sensor.Light:
					LPP_Pin[c].value = pins.map(input.lightLevel(), 0, 255, 0, 1)   // 0 - 255
					break
				case LPP_Bit_Sensor.LED_Brightness:
					LPP_Pin[c].value = pins.map(led.brightness(), 0, 255, 0, 1)    // 0 - 255
					break
				default:
					switch (LPP_Pin[c].ctype) {
						case LPP_DATA_TYPE.Digital_Input:
							LPP_Pin[c].value = pins.digitalReadPin(LPP_Pin[c].id)
							break
						case LPP_DATA_TYPE.Digital_Output:
							break
						case LPP_DATA_TYPE.Analog_Input:
							LPP_Pin[c].value = pins.analogReadPin(LPP_Pin[c].id) / 1024    // 0 - 1023
							break
						case LPP_DATA_TYPE.Analog_Output:
							LPP_Pin[c].value = pins.analogReadPin(LPP_Pin[c].id) / 1024    // 0 - 1023
							break
						default:
							break
					}
			}
			payload = payload + lpp(LPP_Pin[c].ctype, LPP_Pin[c].channel, LPP_Pin[c].value)
		}
		return payload
	}

	/**
	* Update I/O with CayenneLPP
	* @param payload
	*/
	//% weight=97
	//% blockId="cayenneLPP_lpp_update"
	//% block="Update I/O pins with|%payload"
	//% payload.defl="000064FF"
	export function lpp_update(payload: string): void {
		if (LPP_Pin.length > 0) {
			let i = 0
			while ((i * 2) <= (payload.length - 8)) {
				let ch = HexStringToByte(payload.substr(i * 2, 2))
				let l = 0
				do {
					if (LPP_Pin[l].channel == ch)
						break
					else
						l++
				} while (l < LPP_Pin.length)

				if (l >= LPP_Pin.length)
					i = i + 4
				else {
					let v = HexStringToByte(payload.substr(++i * 2, 2))
					v = (v * 256) + HexStringToByte(payload.substr(++i * 2, 2))
					i = i + 2
					switch (LPP_Pin[l].id) {
						case LPP_Bit_Sensor.Temperature:
							break
						case LPP_Bit_Sensor.Light:
							break
						case LPP_Bit_Sensor.LED_Brightness:
							LPP_Pin[l].value = v / 100
							led.setBrightness(Math.floor(pins.map(v, 0, 100, 0, 255)))
							break
						default:
							switch (LPP_Pin[l].ctype) {
								case LPP_DATA_TYPE.Digital_Input:
									break
								case LPP_DATA_TYPE.Digital_Output:
									LPP_Pin[l].value = (v == 0) ? 0 : 1
									pins.digitalWritePin(LPP_Pin[l].id, LPP_Pin[l].value)
									break
								case LPP_DATA_TYPE.Analog_Input:
									break
								case LPP_DATA_TYPE.Analog_Output:
									LPP_Pin[l].value = v
									pins.analogWritePin(LPP_Pin[l].id, LPP_Pin[l].value)
									break
								default:
									break
							}
					}
				}
			}
		}
	}

	/**
	 * Pack Text to HexString.
	 * @param text to convert, eg: "Hello"
	 */
	//% weight=98
	//% help=cayenneLPP/packHexString
	//% blockId="cayenneLPP_packHexString"
	//% block="Convert|%text to hex string"
	//% icon="\uf085"
	//% text.defl="Hello, World!"
	export function packHexString(text: string): string {
		let hexstr = ""
		for (let i = 0; i < text.length; i++)
			hexstr = hexstr + byteToHexString(text.charCodeAt(i))
		return hexstr
	}

	/**
	 * Unpack Hexstring to Text.
	 * @param text to convert, eg: "313233414243" -> "123ABC"
	 */
	//% weight=98
	//% help=cayenneLPP/unpackHexString
	//% blockId="cayenneLPP_unpackHexString"
	//% block="Convert hex string|%text to text"
	//% icon="\uf085"
	//% text.defl="313233414243"
	export function unpackHexString(text: string): string {
		let str = ""
		let temp: Buffer = HexStringToBuf(text)
		for (let i = 0; i < temp.length; i++)
			str = str + String.fromCharCode(temp[i])
		return str
	}

	/**
	 * Extract String to Payload.
	 * @param text to convert, eg: "XXXX,YYYY,ZZZZ" -> ["XXXX"] ["YYYY"] ["ZZZZ"]
	 */
	//% weight=98
	//% help=cayenneLPP/extractPayloadStr
	//% blockId="cayenneLPP_extractPayloadStr
	//% block="Extract payload from |%text with |%indic separator|%sp"
	//% icon="\uf085"
	//% text.defl=":01,0055AAFF"
	//% indic.defl=":"
	//% sp.defl=","
	export function extractPayloadStr(text: string, indic: string, sp: string = ","): string[] {
		let r: string[] = []
		if (indic != "") {
			let n = text.indexOf(indic)
			if (n >= 0) {
				let m = indic.length
				let s = text.substr(n + m, text.length - (n + m))
				r = s.split(sp, 3)
			}
		}
		else
			r = text.split(sp, 3)
		return r
	}
}
