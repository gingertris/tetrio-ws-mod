import {Packr, Unpackr} from "msgpackr";

const PACKET_TYPE_STANDARD = 0x45;
const PACKET_TYPE_EXTRACTED_ID = 0xAE;
const PACKET_TYPE_BATCH = 0x58;
const PACKET_TYPE_EXTENSION = 0xB0;

const EXTENSION_PING = 0x0B;
const EXTENSION_PONG = 0x0C;

const globalUnpackr = new Unpackr({bundleStrings: true, sequential: false});

/**
 * Encodes and decodes ribbon messages.
 */
export class RibbonEncoder {

    packr;
    unpackr;

    /**
     * Terse server-bound ping packet definition.
     */
    PING_PACKET = new Uint8Array([PACKET_TYPE_EXTENSION, EXTENSION_PING]);

    constructor() {
        this.packr = new Packr({sequential: true, bundleStrings: true});
        this.unpackr = new Unpackr({sequential: true, bundleStrings: true});
    }

    /**
     * Encodes a message into a packet.
     * @param message The message to encode.
     * @returns A Uint8Array containing the encoded message.
     */
    encode(message) {
        const body = this.packr.encode(message);
        const packet = new Uint8Array(body.length + 1);

        packet.set([PACKET_TYPE_STANDARD], 0);
        packet.set(body, 1);

        return packet;
    }

    /**
     * Decodes a packet into one or more messages.
     * @param packet The packet to decode.
     * @returns An array of messages.
     */
    decode(packet) {
        const type = packet[0];

        switch (type) {
            case PACKET_TYPE_STANDARD:
                return this.unpackr.unpackMultiple(packet.slice(1));
            case PACKET_TYPE_EXTRACTED_ID:
                const eidView = new DataView(packet.buffer);
                const id = eidView.getUint32(1, false);
                const message = globalUnpackr.unpack(packet.slice(5));
                message.id = id;
                return [message];
            case PACKET_TYPE_BATCH:
                const items = [];
                const lengths = [];

                // Get the lengths
                for (let i = 0; true; i++) {
                    const bytes = new Uint8Array(packet.slice(1 + (i * 4), 1 + (i * 4) + 4));

                    // convert to uint32
                    const length = new DataView(bytes.buffer).getUint32(0, false);

                    if (length === 0) {
                        break;
                    }

                    lengths.push(length);
                }

                // Get the items at those lengths
                let pointer = 0;
                for (let i = 0; i < lengths.length; i++) {
                    items.push(packet.slice(1 + (lengths.length * 4) + 4 + pointer, 1 + (lengths.length * 4) + 4 + pointer + lengths[i]));
                    pointer += lengths[i];
                }

                // todo: i may have been rather stupid here
                return items.map(item => this.decode(item)).flat();
            case PACKET_TYPE_EXTENSION:
                if (packet[1] === EXTENSION_PONG) {
                    return [{command: "x-pong"}];
                } else {
                    throw new Error(`Unknown extension packet type ${packet[1]}`)
                }
            default:
                return this.unpackr.unpackMultiple(packet);
        }
    }
}