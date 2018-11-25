import { Indicator, IndicatorInput } from '../indicator/indicator';
import { SMA } from '../moving_averages/SMA';
import { SD } from '../Utils/SD';
export class BollingerBandsInput extends IndicatorInput {
    period: number;
    stdDev: number;
    values: number[];
}

export class BollingerBandsOutput extends IndicatorInput {
    middle: number;
    upper: number;
    lower: number;
    pb: number;
}

export class BollingerBands extends Indicator {
    constructor(input: BollingerBandsInput) {
        super(input);
        let period = input.period;
        let priceArray = input.values;
        let stdDev     = input.stdDev;
        let format     = this.format;

        let sma, sd;

        this.result = [];

        sma = new SMA({period : period, values : [], format : (v) => v});
        sd  = new SD({period : period, values : [], format : (v) => v});

        this.generator = (function* () {
            let result;
            let tick;
            let calcSMA;
            let calcsd;
            tick = yield;
            while (true) {
                calcSMA = sma.nextValue(tick);
                calcsd  = sd.nextValue(tick);
                if (calcSMA) {
                    let middle = format(calcSMA);
                    let upper = format(calcSMA + (calcsd * stdDev));
                    let lower = format(calcSMA - (calcsd * stdDev));
                    let pb: number = format((tick - lower) / (upper - lower));
                    result = {
                        middle : middle,
                        upper  : upper,
                        lower  : lower,
                        pb     : pb
                    };
                }
                tick = yield result;
            }
        })();

        this.generator.next();

        priceArray.forEach((tick) => {
            let result = this.generator.next(tick);
            if (result.value !== undefined) {
                this.result.push(result.value);
            }
        });
    }


    static calculate = bollingerbands;
    generator: IterableIterator<BollingerBandsOutput | undefined>;

    nextValue(price: number): BollingerBandsOutput | undefined {
        return this.generator.next(price).value;
    }}

export function bollingerbands(input: BollingerBandsInput): BollingerBandsOutput[] {
       Indicator.reverseInputs(input);
        let result = new BollingerBands(input).result;
        if (input.reversedInput) {
            result.reverse();
        }
        Indicator.reverseInputs(input);
        return result;
    }
