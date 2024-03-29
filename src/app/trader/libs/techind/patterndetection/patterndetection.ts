import { Indicator, IndicatorInput } from '../indicator/indicator';
import { getConfig } from '../config';


let isNodeEnvironment = false;

declare var module;
declare var __dirname;
declare var global;

try {
    isNodeEnvironment = Object.prototype.toString.call(global.process) === '[object process]'; 
 } catch (e) {}

// var modelPath = getConfig('MODEL_PATH') || '/dist/model.bin';

let model: any =  {}; /* //new KerasJS.Model({
    filepath: isNodeEnvironment ? __dirname + '/model.bin' : modelPath,
    gpu: false,
    filesystem: isNodeEnvironment
})*/

export class PatternDetectorInput extends IndicatorInput {
    constructor(public values: number[]) {
        super();
    }
}

export enum AvailablePatterns {
    'TD', 
    'IHS',
    'HS',
    'TU',
    'DT',
    'DB'
}

function interpolateArray(data: any, fitCount: any): number[] {
    let linearInterpolate = function (before: any, after: any, atPoint: any) {
        return before + (after - before) * atPoint;
    };

    let newData = new Array();
    let springFactor: any = (data.length - 1) / (fitCount - 1);
    newData[0] = data[0]; // for new allocation
    for ( let i = 1; i < fitCount - 1; i++) {
        let tmp = i * springFactor;
        let before: any = Math.floor(tmp).toFixed();
        let after: any = (Math.ceil(tmp)).toFixed();
        let atPoint = tmp - before;
        newData[i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
}

function l2Normalize(arr: any): number[] {
    let sum = arr.reduce((cum: any, value: any) => cum + (value * value), 0);
    let norm = Math.sqrt(sum);
    return arr.map((v: any) => v / norm);
}

export class PatternDetectorOutput {
    patternId: AvailablePatterns;
    pattern: string;
    probability: number;
}

export async function predictPattern(input: PatternDetectorInput): Promise<PatternDetectorOutput> {
        if (input.values.length < 200) {
            console.warn('Pattern detector requires atleast 250 data for a reliable prediction, received just ', input.values.length);
        }
        await model.ready();
        Indicator.reverseInputs(input);
        let data = input.values;
        let closes = l2Normalize(interpolateArray(data, 400));
        let result = await model.predict({
            input : new Float32Array(closes)
        });
        let index = result.output.indexOf(Math.max(...result.output));
        Indicator.reverseInputs(input);
        return {
            pattern : AvailablePatterns[index] as any,
            patternId: index,
            probability : result.output[index] * 100
        };
}

export async function hasDoubleBottom(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.DB && result.probability > 75);
}

export async function hasDoubleTop(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.DT && result.probability > 75);
}

export async function hasHeadAndShoulder(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.HS && result.probability > 75);
}

export async function hasInverseHeadAndShoulder(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.IHS && result.probability > 75);
}

export async function isTrendingUp(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.TU && result.probability > 75);
}

export async function isTrendingDown(input: PatternDetectorInput): Promise<Boolean> {
    let result = await predictPattern(input);
    return (result.patternId === AvailablePatterns.TD && result.probability > 75);
}

export class PatternDetector extends Indicator {
    static predictPattern = predictPattern;
    static hasDoubleBottom = hasDoubleBottom;
    static hasDoubleTop = hasDoubleTop;
    static hasHeadAndShoulder = hasHeadAndShoulder;
    static hasInverseHeadAndShoulder = hasInverseHeadAndShoulder;
    static isTrendingUp = isTrendingUp;
    static isTrendingDown = isTrendingDown;
}
