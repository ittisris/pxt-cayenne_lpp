// tests go here; this will not be compiled when this package is used as a library
cayenneLPP.add_digital(LPP_Direction.Input_Port, DigitalPin.P0)
cayenneLPP.add_analog(LPP_Direction.Input_Port, AnalogPin.P1)
cayenneLPP.add_sensor(LPP_Bit_Sensor.Light)
cayenneLPP.add_sensor(LPP_Bit_Sensor.LED_Brightness)
cayenneLPP.add_sensor(LPP_Bit_Sensor.Temperature)
basic.forever(function () {
    basic.showString("" + cayenneLPP.lpp_upload() + cayenneLPP.lpp(
    LPP_DATA_TYPE.Temperature,
    99,
    25
    ))
    basic.pause(1000)
})
