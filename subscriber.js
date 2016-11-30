const googleCloud = require('google-cloud');
const configUtil = require('./config/configUtil');

/** Class that allows you to subscribe to a Dow Jones topic feed. This is a singleton. */
class Subscriber {

  constructor() {
    this.gCloudProjectName = configUtil.getProjectName();
    this.gCloudProject = googleCloud({ project: this.gCloudProjectName });
    this.userKey = configUtil.getUserKey();
    this.defaultTopics = configUtil.getTopics();
  }

  /**
   * This callback type is called `subscriptionOnMessageCallback` and is displayed as part of this class.
   *
   * @callback Subscriber~subscriptionOnMessageCallback
   * @param {object} message - The actual Google pubsub message from published from the server and subscribed to by this function.
   * @param {string} topic - The message's topic
   */

  /**
   * This function allows you to subscribe to published topic messages.
   *
   * @param {subscriptionOnMessageCallback} onMessageCallback - The callback that handles the topic message when it arrives.
   * @param {string[]=['ContentEventTranslated']} [topics] - [Optional] collection of topics you wish to subscribe to. Defaults to the topics listed in your credentials security file. Leave as null or undefined if you
   * want to use the default.
   */
  subscribe(onMessageCallback, topics) {
    const ensuredTopics = topics || this.defaultTopics;
    const pubsubClient = this.gCloudProject.pubsub({ projectId: this.gCloudProjectName });
    const subscriptions = [];

    ensuredTopics.forEach((topic) => {
      console.log(`Subscribing to ${topic}`);

      const onMessage = (msg) => {
        msg.skip();
        return onMessageCallback(msg, topic);
      };

      const name = `${topic}_Live_${this.userKey}`;
      console.log(`Subscription name: ${name}`);

      pubsubClient.subscribe(topic, name, { reuseExisting: true, autoAck: true, interval: 10, maxInProgress: 100, timeout: 20000 },
        (err, subscription) => {
          if (err) {
            console.log(`Subscription Error: ${err}`);
          }

          subscriptions.push(subscription);

          subscription.on('error', (subErr) => {
            console.log(`On Subscription Error: ${subErr}`);
            subscription.removeListener('message', onMessage);
            subscription.on('message', onMessage);
          });
          subscription.on('message', onMessage);
        });
    });
  }
}

module.exports = new Subscriber();
