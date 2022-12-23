var connected = false
var upstream = ""
var client_id = ""

function getClientId(s) {
    s.on("upload", data => {
        if (connected) {
            s.allow()
            return
        }
        if (data.length == 0) {
            return
        }
        if (data.charCodeAt(0) != 16) { // first mqtt packet must be CONNECT with control header 0b00010000
            s.deny()
            return
        }
        var remaining_length = 0
        var bytes_pos
        // get remaining length of packet, specified by next 1 to 4 bytes
        for (bytes_pos = 1; bytes_pos < 5; bytes_pos++) {
            var remaining_length_byte = data.charCodeAt(bytes_pos)
            remaining_length = (remaining_length << 8) + (remaining_length_byte & 127) // variable-length encoding scheme that uses one byte for values up to 127
            if (remaining_length_byte < 128) { // MSB is continuation bit, indicates if there are following bytes in the remaining length representation
                bytes_pos++
                break
            }
        }
        var protocol_name_length = (data.charCodeAt(bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)) // next two bytes following remaining length encode protocol name length
        bytes_pos = bytes_pos + protocol_name_length + 4 // variable header ends after protocol name and 4 bytes for protocol level, connect flag, and keep alive 
        var client_id_length = (data.charCodeAt(++bytes_pos) << 8) + (data.charCodeAt(++bytes_pos)) // client id length specified by first two bytes of payload
        // connection is denied if the client does not connect with a client id
        if (!client_id_length > 0) {
            s.deny()
            return
        }
        client_id = data.substring(++bytes_pos, bytes_pos + client_id_length)
        ngx.fetch("http://172.27.76.23:5000/api/lookup?uuid=" + client_id)
            .then(response => response.json())
            .then(response_json => {
                if (response_json.error) {
                    s.deny()
                    return
                }
                if (response_json.server) {
                    connected = true;
                    upstream = response_json.server
                    s.allow()
                }
            })
    })
}

function getClientUpstream() {
    return upstream
}

export default { getClientId, getClientUpstream }
