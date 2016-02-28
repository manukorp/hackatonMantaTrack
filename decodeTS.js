var avlTYPE = "TS";
var ipTOid = [];
var ipTOidCommand = [];
var idEvent = [];
var lastData = [];
var net = require('net');
var crc16 = require('crc-itu').crc16;
var rdsUtils = require("rdsUtils");
var io = require("socket.io-client");
var conf = require('rdsConfig');
socket = io.connect('ws://' + conf.MVT4380.ws_server_host + ':' + conf.MVT4380.ws_server_port);
socket.on("clnCommand", onCLNCommand);
socket.on("wsType", onWSType);

var server = net.createServer(function (socketTCP) { //'connection' listener
    console.log("Connection from " + socketTCP.remoteAddress);
    socketTCP.on('end', function () {
        console.log('server disconnected');
    });
    socketTCP.on('error', function (errData) {
        console.log(errData);
    });

    socketTCP.on('data', function (data) {
        console.log((data + "").length);
        switch ((data + "").length)
        {
            case 80:
                mdmid = parseInt((data + "").substr(1, 12));
                event = (data + "").substr(13, 4);
                dateFA = (data + "").substr(17, 6);
                latitudeFA = (data + "").substr(24, 9);
                latO = (data + "").substr(33, 1);
                latF = GradostoLatitude(latitudeFA, latO);
                longitudeFA = (data + "").substr(34, 10);
                lonO = (data + "").substr(44, 1);
                lngF = GradostoLongitude(longitudeFA, lonO);
                speed = parseFloat((data + "").substr(45, 5)).toFixed(2);
                timeFA = (data + "").substr(50, 6);
                head = parseFloat((data + "").substr(56, 6)).toFixed(2);
                acc = (data + "").substr(62, 8);
                odometer = (data + "").substr(71, 8);

                var infoAVL = {
                    "vhc_mdmid": mdmid.toString(),
                    "vhc_inputs": "0",
                    "vhc_odometer": odometer.toString(),
                    "vhc_satelites": "7",
                    "vhc_event": "0",//event.toString(),
                    "vhc_velocity": speed.toString(),
                    "vhc_altitud": "0",
                    "vhc_longitude": lngF.toString(),
                    "vhc_latitud": latF.toString(),
                    "vhc_heading": head.toString(),
                    "vhc_gpsdatetime": GPSDateTS(dateFA+timeFA),
                    "avl_port": socketTCP.remotePort,
                    "avl_ip": socketTCP.remoteAddress,
                    "type": avlTYPE
                };
                console.log("TS "+mdmid);
                if (parseInt(mdmid) > 0) {
                    socket.emit("srvUpdatePos", infoAVL);
                }

                break;
            case 95:
                break;
        }

        function GradostoLatitude(numero, ns) {
            var latitude = 0.00000;
            if (numero != null) {
                grados = numero.slice(0, 2);
                minutos = numero.slice(2, 4);
                segundos = numero.slice(4, numero.length) * 60;
                latitude = (grados * 1) + (minutos / 60) + (segundos / 3600);
                if (ns == "S")
                    latitude = -latitude;
            }
            return latitude.toFixed(6);
        }

        function GradostoLongitude(numero, ns) {
            var longitude = 0.0000;
            if (numero != null) {
                grados = numero.slice(0, 3);
                minutos = numero.slice(3, 5);
                segundos = numero.slice(5, numero.length) * 60;
                longitude = (grados * 1) + (minutos / 60) + (segundos / 3600);
                if (ns == "W")
                    longitude = -longitude;
            }
            return longitude.toFixed(6);
        }

//            case "18":
//                dateTime = data.slice(4, 10);
//                dateString = GPSDate(dateTime);
//                lat = data.slice(11, 15);
//
//                lon = data.slice(15, 19);
//
////                console.log(latString + "," + lonString);
//                vel = data.slice(19, 20);
//                velString = vel.readUInt8(0, true);
////                console.log("La velocidad es " + velString);
//                var courseA = HexToByn(data.slice(20, 21));
//                var statusGPS = courseA.slice(0, courseA.length - 2);
//                latString = IntegerToGradosDecimal(lat);
//                if (statusGPS.slice(courseA.length - 1) == "0")
//                    latString = -latString;
//                lonString = -IntegerToGradosDecimal(lon);
//                if (statusGPS.slice(courseA.length - 2) == "0")
//                    lonString = -lonString;
//                var courseB = HexToByn(data.slice(21, 22));
//                var course = courseA.slice(courseA.length - 2) + courseB;
//
//                mdmid = ipTOid[socketTCP.remoteAddress];
//                var infoAVL = {
//                    "vhc_mdmid": mdmid,
//                    "vhc_inputs": "0",
//                    "vhc_odometer": "0",
//                    "vhc_satelites": 12, //( statuString == "A") ? "14" : "5",
//                    "vhc_event": idEvent[socketTCP.remoteAddress],
//                    "vhc_velocity": (velString == "") ? "0" : velString.toString(),
//                    "vhc_altitud": 0,
//                    "vhc_longitude": lonString.toString(),
//                    "vhc_latitud": latString.toString(),
//                    "vhc_heading": parseInt(course, 2), //(headingString == "") ? "0" : headingString.toString(),
//                    "vhc_gpsdatetime": dateString.toString(),
//                    "vhc_combustible": 0,
//                    "vhc_combustible_type": 0,
//                    "avl_port": socketTCP.remotePort.toString(),
//                    "avl_ip": socketTCP.remoteAddress.toString(),
//                    "type": avlTYPE
//                };
//                console.log("Location " + ipTOid[socketTCP.remoteAddress]);
//                if (parseInt(mdmid) > 0) {
//                    socket.emit("srvUpdatePos", infoAVL);
//                }
//                break;
//
//            case "19":
//                console.log("Status");
//                crCal = new Buffer(4);
//                crCal[0] = 0x05; //Packet Lengh
//                crCal[1] = data[3];
//                crCal[2] = data[9];
//                crCal[3] = data[10];
//                crc_itu1 = crc16(crCal);
//                var buf = new Buffer(2);
//                buf.writeUInt16BE(crc_itu1, 0);
//
//                msgBuffer = new Buffer(10);
//                msgBuffer[0] = data[0]; //Start Bit
//                msgBuffer[1] = data[1]; //Start Bit
//                msgBuffer[2] = 0x05; //Packet Lengh
//                msgBuffer[3] = data[3]; //Protocol Number
//                msgBuffer[4] = data[9]; //Information Serial Number
//                msgBuffer[5] = data[10]; //Information Serial Number
//                msgBuffer[6] = buf[0]; //Error Check
//                msgBuffer[7] = buf[1]; //Error Check
//                msgBuffer[8] = data[13]; //Stop Bit
//                msgBuffer[9] = data[14]; //Stop Bit
//                socketTCP.write(msgBuffer);
//                var eventBy = myEvent(HexToByn(data.slice(4, 5)), 2);
//                idEvent[socketTCP.remoteAddress] = eventBy;
//                break;
//
//            case "21":
//                console.log("String");
//                break;
//            case "22":
//                console.log("Alarma");
//                dateTime = data.slice(4, 10);
//                dateString = GPSDate(dateTime);
//                lat = data.slice(11, 15);
//                latString = -IntegerToGradosDecimal(lat);
//                lon = data.slice(15, 19);
//                lonString = -IntegerToGradosDecimal(lon);
//                vel = data.slice(19, 20);
//                velString = vel.readUInt8(0, true);
//                course = data.slice(20, 22);
//                binaryCourse = course.toString('binary');
//                var courseA = HexToByn(data.slice(20, 21));
//                var courseB = HexToByn(data.slice(21, 22));
//                console.log((courseA));
//                console.log((courseA));
//                console.log(binaryCourse);
//                var bynEve = HexToByn(data.slice(31, 32));
//                var eventBy = myEvent(bynEve, 101);
//
//                mdmid = ipTOid[socketTCP.remoteAddress];
//                console.log("ConcoxGT06 " + mdmid);
//                var infoAVL = {
//                    "vhc_mdmid": mdmid,
//                    "vhc_inputs": "0",
//                    "vhc_odometer": "0",
//                    "vhc_satelites": 12, //( statuString == "A") ? "14" : "5",
//                    "vhc_event": eventBy,
//                    "vhc_velocity": (velString == "") ? "0" : velString.toString(),
//                    "vhc_altitud": 0,
//                    "vhc_longitude": lonString.toString(),
//                    "vhc_latitud": latString.toString(),
//                    "vhc_heading": "0", //(headingString == "") ? "0" : headingString.toString(),
//                    "vhc_gpsdatetime": dateString.toString(),
//                    "vhc_combustible": 0,
//                    "vhc_combustible_type": 0,
//                    "avl_port": socketTCP.remotePort.toString(),
//                    "avl_ip": socketTCP.remoteAddress.toString(),
//                    "type": avlTYPE
//                };
//
//                if (parseInt(mdmid) > 0) {
//                    socket.emit("srvUpdatePos", infoAVL);
//                }
//                break;
//                break;
//            case "26":
//                console.log("GPS Query");
//                break;
//            case "128":
//                console.log("Comando");
//                break;
//        }
//        lastData[ipTOid[socketTCP.remoteAddress]] = data;
    });
});


server.listen(4756, function () { //'listening' listener
    console.log('server bound');
});

function bufferToInt(dato) {
    decdato = dato.readUInt32BE(0, true);
    return decdato;
}

function onErrorUDP(data) {
    rdsLogs.addLog("onErrorUDP: " + data, 2);
}

function onWSType() {
    socket.emit("clnSetType", {
        "type": "rdsServer"
    });
}

function onCLNCommand(data) {
    try {
        if (data.avl_type == avlTYPE) {
            var cmd = armarComando(data);
            ipTOidCommand[data.avl_ip] = {"cmd": cmd, "data": data};
        }
    } catch (e) {
        var rdsLogs = require("rdsLogs");
        rdsLogs.addLog("onCLNCommand " + e.message, 2);
    }
}

/*
 * ****************************************************************************
 */

function enviarComando(ip) {
    if (ipTOidCommand[ip] != null) {
        socket.emit("srvLogMessage", {
            "msg": "Comando Enviado : " + ipTOidCommand[ip].data.cmd
        });
        var cmdAux = ipTOidCommand[ip];
        ipTOidCommand[ip] = null;
        return cmdAux;
    } else
        return 0;
}

function armarComando(dataCommand) {
    var data = lastData[dataCommand.mdmid];
    msgCmd = new Buffer(dataCommand.msg);
    crCal = new Buffer(11 + msgCmd.length);
    lengthCmd = 12 + msgCmd.length;
    crCal[0] = lengthCmd.toString(16); //Packet Length
    crCal[1] = 0x80; //Protocol Number
    crCal[2] = (msgCmd.length).toString(16); //Command Length
    crCal[3] = 0x01; //ServerFlag
    crCal[4] = 0x01; //ServerFlag
    crCal[5] = 0x01; //ServerFlag
    crCal[6] = 0x01; //ServerFlag
    for (i = 0; i < msgCmd.length - 1; i++) {
        crCal[7 + i] = msgCmd[i];
    }
    crCal[7 + msgCmd.length] = 0x00; //Language
    crCal[7 + msgCmd.length + 1] = 0x02; //Language
    crCal[7 + msgCmd.length + 2] = data[data.length - 6]; //Information Serial Number
    crCal[7 + msgCmd.length + 2] = data[data.length - 5]; //Information Serial Number

    crc_itu1 = crc16(crCal);

    var buf = new Buffer(2);
    buf.writeUInt16BE(crc_itu1, 0);

    msgBuffer = new Buffer(6 + msgCmd.length);
    msgBuffer[0] = data[0]; //Start Bit
    msgBuffer[1] = data[1]; //Start Bit
    for (i = 0; i < msgCmd.length - 1; i++) {
        msgBuffer[2 + i] = crCal[i];
    }
    msgBuffer[2 + msgCmd.length] = buf[0]; //Error Check
    msgBuffer[2 + msgCmd.length + 1] = buf[1]; //Error Check
    msgBuffer[2 + msgCmd.length + 2] = data[data.length - 2]; //Stop Bit
    msgBuffer[2 + msgCmd.length + 3] = data[data.length - 1]; //Stop Bit
    return msgBuffer;
}

function GPSDateTS(fecha) {
    ano = "20" + fecha.slice(0, 2);
    mes = fecha.slice(2, 4);
    dia = fecha.slice(4, 6);
    hor = fecha.slice(6, 8);
    min = fecha.slice(8, 10);
    seg = fecha.slice(10, 12);
    UTCDate = Date.UTC(ano, mes - 1, dia, hor, min, seg);
    newfecha = rdsUtils.DateToMySQLFormat(new Date(UTCDate));
    return newfecha;
}

function IntegerToGradosDecimal(dato) {
    var decdato = dato.readUInt32BE(0, true);
    grados = (decdato * 90) / 162000000;
    return parseFloat(grados).toFixed(6);
}

function HexToByn(dato) {

    res = dato.readUInt8(0, true);
    return ((+res).toString(2));
}
function myEvent(byn, eventDefault) {
    var eventPer = eventDefault;
    switch (byn) {
        case "0":
            eventPer = 9;
            break
        case "100":
            eventPer = 2;
            break
        case "101":
            eventPer = 2;
            break
        case "1010000":
            eventPer = 9;
            break
        case "1000100":
            eventPer = 1;
            break
        case "1000110":
            eventPer = 22;
            break
        case "1000101":
            eventPer = 2;
            break
        case "1100100":
            eventPer = 101;
            break
        case "1100110":
            eventPer = 101;
            break
    }
    return eventPer;
}