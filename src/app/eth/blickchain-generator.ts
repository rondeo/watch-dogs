import * as bitcoin from 'bitcoinjs-lib';
import * as bip from 'bip39';
import * as  etherutils from 'ethereumjs-util';
import * as crypto from 'crypto-js';


export enum ReceiveChange{
  RECEIVE,
  CHANGE
}
export enum AddressPattern{
  BTC,
  ETH
}

export class BlickchainGenerator {
  private _masterNode:any;
  private _mnemonic:string;
  private _password:string;

  constructor(private hd_index:number, private network:any, private pattern:AddressPattern ){

  }



  private masterNode(){
    if(!this._masterNode) {
      let seedHex = bip.mnemonicToSeedHex(this._mnemonic);
      this._masterNode = bitcoin.HDNode.fromSeedHex(seedHex, this.network).deriveHardened(44).deriveHardened(this. hd_index).deriveHardened(0);
    }
    return this._masterNode
  }

  setPassword(password){
    this._password = password;

  }

  setMnemonic(mnemonic:string){
    this._mnemonic = mnemonic;
    this._masterNode = null;
  }

  getAddres(index:number = 0, reseive_change:ReceiveChange = 0){

    switch (this.pattern){
      case AddressPattern.BTC:
        return this.masterNode().derive(reseive_change).derive(index).keyPair.getAddress();
      case AddressPattern.ETH:
        return BlickchainGenerator.generateEtherAddress(this.masterNode().derive(reseive_change).derive(index), crypto);

    }
  }

  getPrivateKey(index:number = 0, reseive_change:ReceiveChange = 0){
    switch (this.pattern){
      case AddressPattern.BTC:
        return this.masterNode().derive(reseive_change).derive(index).keyPair;
    }
  }


  private getReceiveNode(seedHex, coinHDIndex:number, address_index:number, network:any):any {
    var account:number = 0; // most of the time 0
    return bitcoin.HDNode.fromSeedHex(seedHex, network).deriveHardened(44).deriveHardened(coinHDIndex).deriveHardened(account).derive(0).derive(address_index);

  }

  private  getEtherAddres2(x_pub:string, index:number):string {
    let node1 = bitcoin.HDNode.fromBase58(x_pub, null);
    let addressNode = node1.derive(0);
    let ethKeyPair = addressNode.keyPair;
    let ppp = ethKeyPair.getPublicKeyBuffer();
    //console.log('getEtherAddres2');
    return ''//ethers.SigningKey.publicKeyToAddress(ppp);
  }
  private  getEtherAddres(x_pub:string, index:number):string
    {
      let node1 = bitcoin.HDNode.fromBase58(x_pub, null);
      let addressNode = node1.derive(0);
      let ethKeyPair = addressNode.keyPair;
      let ppp = ethKeyPair.getPublicKeyBuffer();
      //console.log('getEtherAddres2');
      return ''//ethers.SigningKey.publicKeyToAddress(ppp);
    }

  generateAddressFromPrivateKey(privateKey:string, pattern:AddressPattern ){

    switch(pattern){
      case AddressPattern.ETH:
        console.log('ETH address')
        return etherutils.addHexPrefix(etherutils.privateToAddress(new Buffer(privateKey, 'hex')).toString('hex'));
      default:
        console.log('BTC  address')
        return bitcoin.ECPair.fromWIF(privateKey, this.network).getAddress()
    }

  }



  static generateEtherAddress(node:any, CryptoJS:any):string {

    var ethKeyPair = node.keyPair;      //        console.log("[ethereum] keyPair :: " + ethKeyPair.d + " :: " + ethKeyPair.__Q);
    var prevCompressed = ethKeyPair.compressed;
    ethKeyPair.compressed = false;
    var pubKey = ethKeyPair.getPublicKeyBuffer();
    //  console.log('ethKeyPairPublicKey     ',ethKeyPairPublicKey);
    var pubKeyHexEth = pubKey.toString('hex').slice(2);
    //  console.log('pubKeyHexEth    ',pubKeyHexEth);
    var pubKeyWordArrayEth = CryptoJS.enc.Hex.parse(pubKeyHexEth);
    var hashEth = CryptoJS.SHA3(pubKeyWordArrayEth, {outputLength: 256});
    var address = hashEth.toString(CryptoJS.enc.Hex).slice(24);
    ethKeyPair.compressed = prevCompressed;
    return "0x" + address;
  }
  }
