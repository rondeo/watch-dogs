
export function fibonacciretracement(start: number, end: number): number[] {
    let levels: number[] = [0 , 23.6, 38.2, 50, 61.8, 78.6, 100, 127.2, 161.8, 261.8, 423.6];
    let retracements: number[];
    if (start < end) {
        retracements = levels.map(function(level) {
            let calculated = end - Math.abs(start - end) * (level) / 100;
            return calculated > 0 ? calculated : 0;
        });
    } else {
        retracements = levels.map(function(level) {
            let calculated = end + Math.abs(start - end) * (level) / 100;
            return calculated > 0 ? calculated : 0;
        });
    }
    return retracements;
}
