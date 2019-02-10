export class RSS {

  static searchCoinInNews(coin: string, news: { title: string, text: string } []): any[] {

    if (!Array.isArray(news)) {
      console.log(news);
      return []
    }
    if (coin.length < 3) return [];
    ;
    return news.filter(function (item) {
      return item.title.indexOf(coin) !== -1 || item.text.indexOf(coin) !== -1;
    });
  }


  static rssChannelItem(item: any[]) {
    return item.map(function (item) {
      return {
        author: item['dc:creator']['#cdata-section'],
        title: item.title['#text'] || item.title['#cdata-section'],
        text: (item.description || item['content:encoded'])['#cdata-section'],
        url: item.guid['#text']
      }
    });
  }

  static feedEntry(item: any[]) {
    return item.map(function (item) {
      return {
        author: item.author['#text'],
        title: item.title['#text'] || item.title['#cdata-section'],
        text: item['content']['#text'],
        url: item.link['@attributes']['href']
      }
    });
  }

  static parceRSSFeed(data) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const json = RSS.xmlToJson(xmlDoc);
    let res = [];
    try {
      if (json.rss) res = RSS.rssChannelItem(json.rss.channel.item);
      else if (json.feed) res = RSS.feedEntry(json.feed.entry);
    } catch (e) {
      console.log(e, json)
    }
    return res;
  }


  static xmlToJson(xml): string | any {
    // Create the return object
    let obj: any = {};
    if (xml.nodeType === 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // text
      const str = xml.nodeValue.trim();
      if (str.length) return str;
    } else if (xml.nodeType === 4) {
      return xml.data;
    }
    // do children
    if (xml.hasChildNodes()) {
      for (let i = 0, n = xml.childNodes.length; i < n; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;

        if (typeof(obj[nodeName]) === 'undefined') {
          const out = this.xmlToJson(item);
          if (Object.keys(out).length) obj[nodeName] = out;
        } else {
          const out2 = RSS.xmlToJson(item);
          if (Object.keys(out2).length === 0) continue;
          if (typeof(obj[nodeName].push) === 'undefined') obj[nodeName] = [obj[nodeName], out2];
          else obj[nodeName].push(out2);

        }
      }
    }
    return obj;
  }
}