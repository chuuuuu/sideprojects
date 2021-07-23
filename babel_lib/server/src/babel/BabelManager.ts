import { readFileSync } from "fs";

type Alphabet = string;
type Index = number;

function split(str: string, blockSize: number) {
  const re = new RegExp(`.{${blockSize}}`, "g");
  const blocks = str.match(re);
  if (!blocks) {
    throw Error("cypher error");
  }

  return blocks;
}

function reverse(str: string) {
  return str.split("").reverse().join("");
}

class AlphabetManager {
  constructor(
    public alphabets: Alphabet[],
    public alphabetsReverse: Record<Alphabet, Index>,
    public bitPerAlphabet: number
  ) {}

  decrypt(cypher: string): string {
    let plain = "";
    const cypherBlocks = split(cypher, this.bitPerAlphabet);

    for (let i = 0; i < cypherBlocks.length; i++) {
      const cypherBlock = cypherBlocks[i];
      const index = parseInt(cypherBlock, 2);
      plain += this.alphabets[index];
    }

    return plain;
  }

  encrypt(plain: string): string {
    let cypher = "";
    for (let i = 0; i < plain.length; i++) {
      cypher += this.alphabetsReverse[plain[i]]
        .toString(2)
        .padStart(this.bitPerAlphabet, "0");
    }

    return cypher;
  }
}

class Shuffler {
  constructor(
    public shuffleTable: number[],
    public shuffleTableReverse: Record<string, number>,
    public initialVector: string,
    public blockSize: number
  ) {}

  xor(str1: string, str2: string): string {
    let ret = "";
    for (let i = 0; i < str1.length; i++) {
      if (str1[i] === str2[i]) ret += "0";
      else ret += "1";
    }

    return ret;
  }

  private encode(block: string) {
    const key = parseInt(block, 2);
    const value = this.shuffleTable[key];
    return value.toString(2).padStart(this.blockSize, "0");
  }

  private decode(block: string) {
    const key = parseInt(block, 2);
    const value = this.shuffleTableReverse[key];
    return value.toString(2).padStart(this.blockSize, "0");
  }

  shuffle(cypherContent: string) {
    const cypherBlocks = split(cypherContent, this.blockSize);
    let prevBlock = this.xor(cypherBlocks[0], this.initialVector);
    prevBlock = this.encode(prevBlock);
    let ret = prevBlock;
    for (let i = 1; i < cypherBlocks.length; i++) {
      prevBlock = this.xor(prevBlock, cypherBlocks[i]);
      prevBlock = this.encode(prevBlock);
      ret += prevBlock;
    }
    return ret;
  }

  deshuffle(cypherAddress: string) {
    let ret = "";
    const cypherBlocks = split(cypherAddress, this.blockSize).reverse();
    let prevBlock = cypherBlocks[0];
    for (let i = 1; i < cypherBlocks.length; i++) {
      prevBlock = this.decode(prevBlock);
      prevBlock = this.xor(cypherBlocks[i], prevBlock);
      ret = prevBlock + ret;
      prevBlock = cypherBlocks[i];
    }
    prevBlock = this.decode(prevBlock);
    prevBlock = this.xor(prevBlock, this.initialVector);
    ret = prevBlock + ret;

    return ret;
  }
}

export class BabelManager {
  static contentManager = new AlphabetManager(
    JSON.parse(readFileSync(__dirname + "/../db/babel_alphabets.json", "utf8")),
    JSON.parse(
      readFileSync(__dirname + "/../db/babel_alphabets_reverse.json", "utf8")
    ),
    14
  );

  static addressManager = new AlphabetManager(
    JSON.parse(
      readFileSync(__dirname + "/../db/base64_alphabets.json", "utf8")
    ),
    JSON.parse(
      readFileSync(__dirname + "/../db/base64_alphabets_reverse.json", "utf8")
    ),
    5
  );

  static shuffler1 = new Shuffler(
    JSON.parse(readFileSync(__dirname + "/../db/shuffle_table.json", "utf8")),
    JSON.parse(
      readFileSync(__dirname + "/../db/shuffle_table_reverse.json", "utf8")
    ),
    JSON.parse(readFileSync(__dirname + "/../db/initial_vector.json", "utf8")),
    14
  );

  static shuffler2 = new Shuffler(
    JSON.parse(readFileSync(__dirname + "/../db/shuffle_table copy.json", "utf8")),
    JSON.parse(
      readFileSync(__dirname + "/../db/shuffle_table_reverse copy.json", "utf8")
    ),
    JSON.parse(readFileSync(__dirname + "/../db/initial_vector copy.json", "utf8")),
    14
  );

  static contentLen = 1250;
  static addressLen = 3500;

  // cypherLen = 17500
  static encryptCypherContent(cypherContent: string) {
    cypherContent = this.shuffler1.deshuffle(cypherContent);
    cypherContent = reverse(cypherContent);
    cypherContent = this.shuffler2.shuffle(cypherContent);
    cypherContent = reverse(cypherContent);
    cypherContent = this.shuffler1.shuffle(cypherContent);
    cypherContent = reverse(cypherContent);
    cypherContent = this.shuffler2.deshuffle(cypherContent);
    return cypherContent;
  }

  static decryptCypherContent(cypherAddress: string) {
    cypherAddress = this.shuffler2.shuffle(cypherAddress);
    cypherAddress = reverse(cypherAddress);
    cypherAddress = this.shuffler1.deshuffle(cypherAddress);
    cypherAddress = reverse(cypherAddress);
    cypherAddress = this.shuffler2.deshuffle(cypherAddress);
    cypherAddress = reverse(cypherAddress);
    cypherAddress = this.shuffler1.shuffle(cypherAddress);
    return cypherAddress;
  }

  static getAddress(plainContent: string) {
    const plainContentWithPad = plainContent.padEnd(this.contentLen, " ");
    const cypherContent = this.contentManager.encrypt(plainContentWithPad);
    const cypherAddress = this.encryptCypherContent(cypherContent);
    const plainAddress = this.addressManager.decrypt(cypherAddress);
    return plainAddress;
  }

  static getContent(plainAddress: string) {
    const plainAddressWithPad = plainAddress.padStart(this.addressLen, "A");
    const cypherAddress = this.addressManager.encrypt(plainAddressWithPad);
    const cypherContent = this.decryptCypherContent(cypherAddress);
    const plainContent = this.contentManager.decrypt(cypherContent);
    return plainContent;
  }
}
