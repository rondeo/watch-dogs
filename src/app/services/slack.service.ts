
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class SlackService {

  private usersUrl = 'https://slack.com/api/users.list';
  private messageUrl = 'https://slack.com/api/chat.postMessage';
  private url = 'https://slack.com/api/chat.postMessage?' +
    'token=xoxp-280310993205-280093410915-280168420722-37803fd28649fd2e8421e60a20ec120a&channel={{channel}}&text={{message}}&pretty=1';

  private token = 'xoxp-280310993205-280093410915-280168420722-37803fd28649fd2e8421e60a20ec120a';
  private botToken = 'xoxb-280314875477-WRqZH58Rnw88MAmVzz1GOaSt';
  private sendTo = 'C884X67FU';
  private uplight = 'U882RC2SX';

  messages: string[];
  channel: string;

  constructor(private http: HttpClient) {

    // this.sendMessage('hello ',this.uplight ).toPromise().then(console.log).catch(console.error);

  }

  sendMessage(message: string, channel: string) {
    if (this.channel && this.channel !== channel) console.error(' only one channel support');
    this.channel = channel;
   // this.messages.push(message);

    return this.call(this.messageUrl, {text: message, channel: channel});

 /*  let url =  this.url.replace('{{message}}', message).replace('{{channel}}', channel);
   return this.http.get(url);*/
  }


  private call(url, vars) {
    vars.token = this.token;
    return this.http.get(url, {params: vars});
  }


}
