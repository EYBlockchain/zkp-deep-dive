import Web3 from 'web3';
import config from 'config';

export default {
  connection() {
    return this.web3;
  },

  /**
   * Connects to web3 and then sets proper handlers for events
   */
  connect() {
    if (this.web3) return this.web3.currentProvider;

    console.log('Blockchain Connecting ...');
    const provider = new Web3.providers.WebsocketProvider(config.get('web3ProviderURL'));

    provider.on('error', console.error);
    provider.on('connect', () => console.log('Blockchain Connected ...'));
    provider.on('end', console.error);

    this.web3 = new Web3(provider);

    return provider;
  },

  /**
   * Checks the status of connection
   *
   * @return {Boolean} - Resolves to true or false
   */
  isConnected() {
    if (this.web3) {
      return this.web3.eth.net.isListening();
    }
    return false;
  },
};
