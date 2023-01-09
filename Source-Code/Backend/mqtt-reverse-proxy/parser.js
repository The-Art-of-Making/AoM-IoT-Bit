// TODO inherit and access env vars from process
const ip = 'mqtt-client-auth-service';
const port = '5000'

const mqtt_client_auth_endpoint = 'http://' + ip + ':' + port + '/nginx/auth/client';

var upstream = '';

function getClientId(s) {
    s.on('upload', async function (data, flags) {

        var client_id;
        var client_password;

        if (data.length == 0) {
            return
        }
        if (data.charCodeAt(0) != 16) { // first mqtt packet must be CONNECT with control header 0b00010000
            s.deny();
            return;
        }

        var remaining_length = 0;
        var bytes_pos;

        // get remaining length of packet, specified by next 1 to 4 bytes
        for (bytes_pos = 1; bytes_pos < 5; bytes_pos++) {
            var remaining_length_byte = data.charCodeAt(bytes_pos);
            remaining_length = (remaining_length << 8) + (remaining_length_byte & 127); // variable-length encoding scheme that uses one byte for values up to 127
            if (remaining_length_byte < 128) { // MSB is continuation bit, indicates if there are following bytes in the remaining length representation
                bytes_pos++;
                break;
            }
        }
        var protocol_name_length = (data.charCodeAt(bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)); // next two bytes following remaining length encode protocol name length
        bytes_pos = bytes_pos + protocol_name_length + 4; // variable header ends after protocol name and 4 bytes for protocol level, connect flag, and keep alive

        // Get client id
        var client_id_length = (data.charCodeAt(++bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)); // client id length specified by first two bytes of payload
        // connection is denied if the client does not connect with a client id
        if (!client_id_length > 0) {
            s.deny();
            return;
        }
        client_id = data.substring(++bytes_pos, bytes_pos + client_id_length);

        // Skip MQTT username
        bytes_pos += client_id_length;
        var client_username_length = (data.charCodeAt(bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)); // client password length specified by next two bytes of payload after client id
        bytes_pos++;

        // Get client password
        bytes_pos += client_username_length;
        var client_password_length = (data.charCodeAt(bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)); // client password length specified by next two bytes of payload after client username
        // connection is denied if the client does not connect with a client password
        if (!client_password_length > 0) {
            s.deny();
            return;
        }
        client_password = data.substring(++bytes_pos, bytes_pos + client_password_length);

        // make request to client auth service and get upstream server
        if (client_id.length > 0) {
            s.off('upload');
            let reply = await ngx.fetch(mqtt_client_auth_endpoint + "?username=" + client_id + "&password=" + client_password);
            let json = await reply.json();
            upstream = json.server;
            (reply.status == 200) ? s.allow() : s.deny();

        } else {
            s.deny();
        }
    });
}

function getClientUpstream() {
    return upstream;
}

export default { getClientId, getClientUpstream };
