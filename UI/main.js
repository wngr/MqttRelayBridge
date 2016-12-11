"use strict";
import v4 from 'aws-signature-v4';
import crypto from 'crypto';
import MqttClient from './node_modules/mqtt/lib/client';
import websocket from 'websocket-stream';

const AWS_ACCESS_KEY = '';
const AWS_SECRET_ACCESS_KEY = '';
const AWS_IOT_ENDPOINT_HOST = '';
const AWS_REGION = 'eu-central-1'
const MQTT_TOPIC_PUB = ''
var client;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4();
}

function connect() {
    client = new MqttClient(() => {
        var url = v4.createPresignedURL(
            'GET',
            AWS_IOT_ENDPOINT_HOST.toLowerCase(),
            '/mqtt',
            'iotdevicegateway',
            crypto.createHash('sha256').update('', 'utf8').digest('hex'),
            {
                'key': AWS_ACCESS_KEY,
                'secret': AWS_SECRET_ACCESS_KEY,
                'region': AWS_REGION,
                'protocol': 'wss',
                'expires': 15
            }
        );

        addLogEntry('Connecting to URL: ' + url);
        return websocket(url, [ 'mqttv3.1' ]);
    });

    client.on('connect', () => {
        addLogEntry('Successfully connected!');
    });

    client.on('close', () => {
        addLogEntry('Failed to connect :-(');
        client.end();  // don't reconnect
        client = undefined;
    });
}

document.getElementById('connect').addEventListener('click', () => {
    connect();
});

document.getElementById('send').addEventListener('click', () => {
    var relayValue = document.getElementById('relayValue').value;
    //const message = JSON.stringify(obj)
    addLogEntry('Outgoing message: ' + relayValue);
    client.publish(MQTT_TOPIC_PUB, relayValue);
});

function addLogEntry(info) {
    const newLogEntry = document.createElement('li');
    newLogEntry.textContent = '[' + (new Date()).toTimeString().slice(0, 8) + '] ' + info;

    const theLog = document.getElementById('the-log');
    theLog.insertBefore(newLogEntry, theLog.firstChild);
}

connect();
