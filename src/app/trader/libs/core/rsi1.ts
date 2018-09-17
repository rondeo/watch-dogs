import * as _ from 'lodash';

export class Rsi1 {
  period = 14;
  dataKey = 'rsi';

  wildersSmoothing(values, prevAvg) {
    return prevAvg + (values[values.length - 1] - prevAvg) / values.length;
  };

// If possible, use wilderSmoothing if not just use the mean (e.g. first N values)
  updateAverage(changes: Float32Array, prevAverage) {
    return prevAverage !== undefined ? this.wildersSmoothing(changes, prevAverage) : _.mean(changes);
  };


  ctrModifier(data: { close: number, hasClosed?: boolean }[]) {
    let slidingWindowUpMoves = new Float32Array(this.period);
    let slidingWindowDownMoves = new Float32Array(this.period);

    for (var i = 0; i < data.length; i++) {
      const record = data[i];

      // First N records cannot be calculated, leave the existing value in there if it was already calculated
      if (i < this.period || record.hasClosed) {
        record[this.dataKey] = record[this.dataKey] || {
          value: undefined,
          averageUp: undefined,
          averageDown: undefined
        };
        continue;
      }

      // Go backwards Period
      let index = 0;
      for (let j = i - this.period + 1; j <= i; j++) {
        let change = data[j].close - data[j - 1].close;

        slidingWindowUpMoves[index] = (change > 0 ? change : 0);
        slidingWindowDownMoves[index] = (change < 0 ? Math.abs(change) : 0);
        index += 1;
      }

      let prevRecord = data[i - 1];

      // Calculate average of the last UP moves - smooth using previous records averageUp
      let averageUp = this.updateAverage(slidingWindowUpMoves, prevRecord[this.dataKey].averageUp);

      // Calculate the average of the last DOWN moves - smooth using previous records down
      let averageDown = this.updateAverage(slidingWindowDownMoves, prevRecord[this.dataKey].averageDown);

      // Normalize to 0.0 - 1.0
      let RS = averageUp / averageDown;
      let value = 100 - (100 / (1 + RS));

      // Store the averageUp/averageDown value so the next record can use it
      record[this.dataKey] = {
        value,
        averageUp,
        averageDown
      };
    }
    ;

  }
}