export class SMA {
  input = 'price';
  prices = [];
  result = 0;
  age = 0;
  sum = 0;

  constructor(public windowLength: number) {

  }

  update(price: number) {
    const tail = this.prices[this.age] || 0; // oldest price in window
    this.prices[this.age] = price;
    this.sum += price - tail;
    this.result = this.sum / this.prices.length;
    this.age = (this.age + 1) % this.windowLength
  }

}

export class SMMA {
  input = 'price';
  sma: SMA;
  prices = [];
  result = 0;
  age = 0;

  constructor(public weight: number) {
    this.sma = new SMA(weight);
  }

  update(price) {
    this.prices[this.age] = price;
    if (this.prices.length < this.weight) {
      this.sma.update(price);
    } else if (this.prices.length === this.weight) {
      this.sma.update(price);
      this.result = this.sma.result;
    } else {
      this.result = (this.result * (this.weight - 1) + price) / this.weight;
    }

    this.age++;
  }
}