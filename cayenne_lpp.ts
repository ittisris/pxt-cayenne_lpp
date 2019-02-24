/**
 * https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
 */
enum LPP_DATA_TYPE {
    //% block="Digital Input"
    Digital_Input = 0,
    //% block="Digital Output"
    Digital_Output = 1,
    //% block="Analog Input"
    Analog_Input = 2,
    //% block="Analog Output"
    Analog_Output = 3,
    //% block="Temperature"
    Temperature_Sensor = 103
};

enum LPP_Bit_Sensor {
    //% block="Temparature Sensor"
    Temperature = 51,
    //% block="Light Level"
    Light,
    //% block="LED Brightness"
    LED_Brightness,
};

enum LPP_Direction {
    //% block="Input"
    Input_Port = 0,
    //% block="Output"
    Output_Port = 1,
};
// const LPP_Pin_Chan: number[] = [-1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20]

/**
 * Custom blocks
 */
//% color=#75b233 icon="\uf085" weight=96
namespace cayenneLPP {

    //%
    function getchan(id: number): number {
        switch (id) {
            case DigitalPin.P0: return 0
            case DigitalPin.P1: return 1
            case DigitalPin.P2: return 2
            case DigitalPin.P3: return 3
            case DigitalPin.P4: return 4
            case DigitalPin.P5: return 5
            case DigitalPin.P6: return 6
            case DigitalPin.P7: return 7
            case DigitalPin.P8: return 8
            case DigitalPin.P9: return 9
            case DigitalPin.P10: return 10
            case DigitalPin.P11: return 11
            case DigitalPin.P12: return 12
            case DigitalPin.P13: return 13
            case DigitalPin.P14: return 14
            case DigitalPin.P15: return 15
            case DigitalPin.P16: return 16
            case DigitalPin.P19: return 19
            case DigitalPin.P20: return 20
            case LPP_Bit_Sensor.Temperature: return 21
            case LPP_Bit_Sensor.Light: return 22
            case LPP_Bit_Sensor.LED_Brightness: return 23
            default: return -1
        }
    }

    class cayenneLPP {
        id: number
        channel: number
        ctype: number    // false = Input

        constructor(id: number, ctype: LPP_DATA_TYPE) {
            this.id = id
            this.channel = getchan(id)
            this.ctype = ctype
        }
    }

    let LPP_Temparature: cayenneLPP = null
    let LPP_Light: cayenneLPP = null
    let LPP_Brightness: cayenneLPP = null
    let LPP_Pin_0: cayenneLPP = null
    let LPP_Pin: cayenneLPP[] = []

    //%
    function byteToHexString(value: number): string {
        return (("0123456789ABCDEF"[value >> 4]) + ("0123456789ABCDEF"[value & 0xF]))
    }

    //%
    function intToHexString(value: number): string {
        return (byteToHexString(value >> 8) + byteToHexString(value & 0xFF))
    }

    /**
    * Convert Raw Data to Cayenne Low-Powered Payload (Hexstring) https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
    * @param llpType Cayenne LPP Type
    * @param channel LPP Channel from 1-255
    * @param value Number
    */
    //% weight=90
    //% blockId="cayenneLPP_lpp"
    //% block="Convert to CayenneLPP|Type %llpType|at Channel %channel|with Raw Data %value"
    //% channel.defl=1
    //% channel.min=1 channel.max=255
    export function lpp(llpType: LPP_DATA_TYPE, channel: number, value: number, ratio = 1): string {
        let header = byteToHexString(channel) + byteToHexString(llpType)
        switch (llpType) {
            case LPP_DATA_TYPE.Digital_Input: return (header + (value <= 0 ? "00" : "01"))
            case LPP_DATA_TYPE.Digital_Output: return (header + (value <= 0 ? "00" : "01"))
            case LPP_DATA_TYPE.Analog_Input: return (header + intToHexString(Math.round((value / ratio) * 100)))
            case LPP_DATA_TYPE.Analog_Output: return (header + intToHexString(Math.round((value / ratio) * 100)))
            case LPP_DATA_TYPE.Temperature_Sensor: return (header + intToHexString(value * 10))
            default: return ""
        }
    }

    /**
    * Register Sensor 
    * @param sensor Sensortype
    */
    //% weight=99
    //% blockId="cayenneLPP_register_sensor"
    //% block="Register %sensor"
    //% pin.defl=LPP_Bit_Sensor.Temperature
    export function register_sensor(sensor: LPP_Bit_Sensor) {
        switch (sensor) {
            case LPP_Bit_Sensor.Temperature:
                LPP_Temparature = new cayenneLPP(sensor, LPP_DATA_TYPE.Temperature_Sensor)
                LPP_Pin.push(LPP_Temparature)
                break

            case LPP_Bit_Sensor.Light:
                LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Input)
                LPP_Pin.push(LPP_Light)
                break

            case LPP_Bit_Sensor.LED_Brightness:
                LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Output)
                LPP_Pin.push(LPP_Light)
                break
        }
    }

    /**
        * Register Digital Pin to CayenneLLP
        * @param pin DigitalPin
    */
    //% weight=100
    //% blockId="cayenneLPP_register_digital"
    //% block="Register Digital %dir|Pin %pin"
    //% pin.defl=DigitalPin.P0
    export function register_digital(dir: LPP_Direction, pin: DigitalPin) {
        if (dir == LPP_Direction.Input_Port)
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Digital_Input)
        else
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Output)
        LPP_Pin.push(LPP_Pin_0)
    }

    /**
        * Register Analog Pin to CayenneLLP
        * @param pin AnologPin
    */
    //% weight=100
    //% blockId="cayenneLPP_register_analog"
    //% block="Register Analog %dir|Pin %pin"
    //% pin.defl=AnalogPin.P0
    export function register_analog(dir: LPP_Direction, pin: AnalogPin) {
        if (dir == LPP_Direction.Input_Port)
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Input)
        else
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Output)
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
        for (let s = 0; s < LPP_Pin.length; s++) {
            switch (LPP_Pin[s].id) {
                case LPP_Bit_Sensor.Temperature:
                    payload = payload + lpp(LPP_Pin[s].ctype, LPP_Pin[s].channel, input.temperature())      // celsius
                    break
                case LPP_Bit_Sensor.Light:
                    payload = payload + lpp(LPP_Pin[s].ctype, LPP_Pin[s].channel, input.lightLevel())    // 0 - 255
                    break
                case LPP_Bit_Sensor.LED_Brightness:
                    payload = payload + lpp(LPP_Pin[s].ctype, LPP_Pin[s].channel, led.brightness())     // 0 - 255
                    break
                default:
                    switch (LPP_Pin[s].ctype) {
                        case LPP_DATA_TYPE.Digital_Input:
                        case LPP_DATA_TYPE.Digital_Output:
                            payload = payload + lpp(LPP_Pin[s].ctype, LPP_Pin[s].channel, pins.digitalReadPin(LPP_Pin[s].id))
                            break
                        case LPP_DATA_TYPE.Analog_Input:
                        case LPP_DATA_TYPE.Analog_Output:
                            payload = payload + lpp(LPP_Pin[s].ctype, LPP_Pin[s].channel, pins.analogReadPin(LPP_Pin[s].id), 4)    // 0 - 1023 -> 0 - 255
                            break
                        default:
                            break
                    }
            }
        }
        return payload
    }

    /**
    * Update I/O with CayenneLPP
    * @param no
    */
    //% weight=97
    //% blockId="cayenneLPP_lpp_update"
    //% block="Update I/O form hex string|%payload"
    export function lpp_update(payload: string) {
    }

    /**
    * Read and convert Digital Input Pin to CayenneLLP
    * @param pin DigitalPin
    */
    //% weight=99
    //% blockId="cayenneLPP_digital_input"
    //% block="Read Digital Input Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=DigitalPin.P0
    function digital_input(pin: DigitalPin): string {
        let channel = getchan(pin)
        return lpp(LPP_DATA_TYPE.Digital_Input, channel, pins.digitalReadPin(pin))
    }

    /**
    * Read and convert Digital Output Pin to CayenneLLP
    * @param pin DigitalPin
    */
    //% weight=98
    //% blockId="cayenneLPP_digital_output"
    //% block="Read Digital Output Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=DigitalPin.P0
    function digital_output(pin: DigitalPin): string {
        let channel = getchan(pin)
        return lpp(LPP_DATA_TYPE.Digital_Output, channel, pins.digitalReadPin(pin))
    }

    /**
    * Read and convert Analog Input Pin to CayenneLLP
    * @param pin AnalogPin
    */
    //% weight=97
    //% blockId="cayenneLPP_analog_input"
    //% block="Read Analog Input Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=AnalogPin.P0
    function analog_input(pin: AnalogPin): string {
        let channel = getchan(pin)
        return lpp(LPP_DATA_TYPE.Analog_Input, channel, pins.analogReadPin(pin))
    }

    /**
    * Read and convert AnalogPin Output to CayenneLLP
    * @param pin AnalogPin
    */
    //% weight=96
    //% blockId="cayenneLPP_analog_output"
    //% block="Read Analog Output Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=AnalogPin.P0
    function analog_output(pin: AnalogPin): string {
        let channel = getchan(pin)
        return lpp(LPP_DATA_TYPE.Analog_Output, channel, pins.analogReadPin(pin))
    }
}
