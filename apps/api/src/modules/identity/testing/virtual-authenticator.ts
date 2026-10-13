import {
  createHash,
  createSign,
  generateKeyPairSync,
  randomBytes,
  type KeyObject,
} from 'node:crypto';

/** The app the release build is: named by its signing certificate. */
export const APP_ORIGIN =
  'https://bisellautoiq.co.zw';

interface CreationOptions {
  challenge: string;
  rp: { id?: string };
  user: { id: string };
}

interface RequestOptions {
  challenge: string;
  rpId?: string;
}

// Authenticator data flags: user present, user verified, backup eligible,
// backed up, attested credential data included.
const UP = 0x01;
const UV = 0x04;
const BE = 0x08;
const BS = 0x10;
const AT = 0x40;

/**
 * A passkey held in memory, doing what a phone does: it makes a key pair,
 * hands over the public half when the passkey is created, and signs each
 * sign-in challenge with the private half. Nothing here knows about the
 * server, so a test that passes proves the server checked a real signature.
 */
export class VirtualAuthenticator {
  readonly credentialId = randomBytes(32);
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;
  private userHandle = '';

  constructor(public origin: string = APP_ORIGIN, public verified = true) {
    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    this.privateKey = pair.privateKey;
    this.publicKey = pair.publicKey;
  }

  get id(): string {
    return this.credentialId.toString('base64url');
  }

  /** The answer to "create a passkey". */
  create(options: CreationOptions) {
    this.userHandle = options.user.id;
    const clientData = this.clientData('webauthn.create', options.challenge);
    const authData = Buffer.concat([
      rpIdHash(options.rp.id ?? ''),
      Buffer.from([UP | (this.verified ? UV : 0) | BE | BS | AT]),
      uint32(0),
      Buffer.alloc(16), // aaguid: none
      uint16(this.credentialId.length),
      this.credentialId,
      this.coseKey(),
    ]);
    const attestationObject = Buffer.concat([
      Buffer.from([0xa3]),
      cborText('fmt'),
      cborText('none'),
      cborText('attStmt'),
      Buffer.from([0xa0]),
      cborText('authData'),
      cborBytes(authData),
    ]);
    return {
      authenticatorAttachment: 'platform',
      clientExtensionResults: {},
      id: this.id,
      rawId: this.id,
      response: {
        attestationObject: attestationObject.toString('base64url'),
        clientDataJSON: clientData.toString('base64url'),
        transports: ['internal', 'hybrid'],
      },
      type: 'public-key',
    };
  }

  /** The answer to "sign in with a passkey". */
  get(options: RequestOptions, signWith: KeyObject = this.privateKey) {
    const clientData = this.clientData('webauthn.get', options.challenge);
    const authData = Buffer.concat([
      rpIdHash(options.rpId ?? ''),
      Buffer.from([UP | (this.verified ? UV : 0) | BE | BS]),
      uint32(0),
    ]);
    const signature = createSign('SHA256')
      .update(Buffer.concat([authData, sha256(clientData)]))
      .sign(signWith);
    return {
      authenticatorAttachment: 'platform',
      clientExtensionResults: {},
      id: this.id,
      rawId: this.id,
      response: {
        authenticatorData: authData.toString('base64url'),
        clientDataJSON: clientData.toString('base64url'),
        signature: signature.toString('base64url'),
        userHandle: this.userHandle,
      },
      type: 'public-key',
    };
  }

  /** Someone who knows the passkey's id but does not hold its private key. */
  forge(options: RequestOptions) {
    const stranger = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    return this.get(options, stranger.privateKey);
  }

  private clientData(type: string, challenge: string): Buffer {
    return Buffer.from(
      JSON.stringify({
        challenge,
        crossOrigin: false,
        origin: this.origin,
        type,
      }),
    );
  }

  /** The public key as a COSE EC2 key: ES256 on P-256. */
  private coseKey(): Buffer {
    const jwk = this.publicKey.export({ format: 'jwk' });
    const x = Buffer.from(jwk.x ?? '', 'base64url');
    const y = Buffer.from(jwk.y ?? '', 'base64url');
    return Buffer.concat([
      Buffer.from([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21]),
      cborBytes(x),
      Buffer.from([0x22]),
      cborBytes(y),
    ]);
  }
}

const sha256 = (data: Buffer): Buffer =>
  createHash('sha256').update(data).digest();

const rpIdHash = (rpId: string): Buffer => sha256(Buffer.from(rpId));

function uint16(value: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
}

function uint32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function cborHead(major: number, length: number): Buffer {
  if (length < 24) return Buffer.from([(major << 5) | length]);
  if (length < 256) return Buffer.from([(major << 5) | 24, length]);
  return Buffer.concat([Buffer.from([(major << 5) | 25]), uint16(length)]);
}

const cborBytes = (bytes: Buffer): Buffer =>
  Buffer.concat([cborHead(2, bytes.length), bytes]);

const cborText = (text: string): Buffer =>
  Buffer.concat([cborHead(3, Buffer.byteLength(text)), Buffer.from(text)]);
