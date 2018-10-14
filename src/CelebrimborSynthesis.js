/**
 * 
 */
import {Celebrimbor} from "./Celebrimbor.js";

export default class CelebrimborSynthesis extends Celebrimbor
{
    constructor(options = {}) {
        super();
        this.initSynthesisProps();
        this.initSynthesis();
    }

    initSynthesisConditional() {
        if(this.getProps().synthesis === null) {
            this.initSynthesisProps();
            this.initSynthesis();
        }
    }

    /**
     * @description для инициализации без создания нового объекта
     */
    initSynthesisEvents() {
        this.getSynthesis().events = {
            // events on Celebrimbor saying
            BEFORE_SAY: 'BEFORE_SAY',
            AFTER_SAY: 'AFTER_SAY',

            // events on Celebrimbor finished say
            BEFORE_SAY_FINISHED: 'BEFORE_SAY_FINISHED',
            AFTER_SAY_FINISHED: 'AFTER_SAY_FINISHED',

            // not attaching events
            SYNTHESIS_START: "SYNTHESIS_START",
            SYNTHESIS_END: "SYNTHESIS_END",
        };
    }

    isInitEvents() {
        return this.getSynthesis().events !== null;
    }

    initSynthesisProps() {
        this.getProps().synthesis = {
            voices: {},
            voice: {
                default: false,
                lang: "ru-RU",
                localService: false,
                name: "Google UK English Male",
                voiceURI: "Google UK English Male"
            },
            helpers: {
                redirectRecognizedTextOutput: null,
                remoteProcessorHandler: null,
                lastSay: null,
                fatalityPromiseCallback: null
            },
            events: {},
            isSpeaking: false,
            garbageCollection: [],
            speed: 1,
            volume: 1,
            obeying: true,
            soundex: false,
            //continuous: true,
            name: 'Celebrimbor',
        }
    }
    
    initSynthesis() {
        if (this.synthesisSupported()) {
            speechSynthesis.getVoices();
        } else {
            this.console('Celebrimbor can\'t speak without the Speech Synthesis API');
        }

        this.getProps().synthesis.voices = {
            // German
            "de-DE": ["Google Deutsch", "de-DE", "de_DE"],
            // Spanish
            "es-ES": ["Google español", "es-ES", "es_ES", "es-MX", "es_MX"],
            // Italian
            "it-IT": ["Google italiano", "it-IT", "it_IT"],
            // Japanese
            "jp-JP": ["Google 日本人", "ja-JP", "ja_JP"],
            // English USA
            "en-US": ["Google US English", "en-US", "en_US"],
            // English UK
            "en-GB": ["Google UK English Male", "Google UK English Female", "en-GB", "en_GB"],
            // Brazilian Portuguese
            "pt-BR": ["Google português do Brasil", "pt-PT", "pt-BR", "pt_PT", "pt_BR"],
            // Portugal Portuguese
            // Note: in desktop, there's no voice for portugal Portuguese
            "pt-PT": ["Google português do Brasil", "pt-PT", "pt_PT"],
            // Russian
            "ru-RU": ["Google русский", "ru-RU", "ru_RU"],
            // Dutch (holland)
            "nl-NL": ["Google Nederlands", "nl-NL", "nl_NL"],
            // French
            "fr-FR": ["Google français", "fr-FR", "fr_FR"],
            // Polish
            "pl-PL": ["Google polski", "pl-PL", "pl_PL"],
            // Indonesian
            "id-ID": ["Google Bahasa Indonesia", "id-ID", "id_ID"],
            // Hindi
            "hi-IN": ["Google हिन्दी", "hi-IN", "hi_IN"],
            // Mandarin Chinese
            "zh-CN": ["Google 普通话（中国大陆）", "zh-CN", "zh_CN"],
            // Cantonese Chinese
            "zh-HK": ["Google 粤語（香港）", "zh-HK", "zh_HK"],
            // Native voice
            "native": ["native"]
        }

        this.initSynthesisEvents();
    }

    /**
     *
     * @param {Number} speed
     * @see: https://github.com/mdn/web-speech-api/tree/master/speak-easy-synthesis
     */
    setSpeed(speed) {
        this.getSynthesis().speed = speed;
    }

    /**
     *
     * @param {Number} volume
     * @see https://github.com/mdn/web-speech-api/tree/master/speak-easy-synthesis
     */
    setVolume(volume) {
        this.getSynthesis().volume = volume;
    }

    /**
     *
     * @param text
     * @param actualChunk
     * @param totalChunks
     * @param callbacks
     */
    speak(text, actualChunk, totalChunks, callbacks) {

        let msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.volume = this.getSynthesis().volume;
        msg.rate = this.getSynthesis().speed;

        // Выбераем голос в соответствии с выбором
        let availableVoice = this.getVoice(this.getSynthesis().voice.lang);

        if (callbacks) {
            if (callbacks.hasOwnProperty('lang')) {
                availableVoice = this.getVoice(callbacks.lang);
            }
        }

        if (this.getProps().device.isMobile) {
            if (availableVoice) {
                msg.lang = availableVoice.lang;
            }
        } else {
            msg.voice = availableVoice;
        }

        if (actualChunk == 1) {
            msg.addEventListener('start', () => {
                this.getSynthesis.isSpeaking = true;

                if(this.isDebug()) {
                    this.console('Event reached : ' + this.getSynthesis().events.SYNTHESIS_START);
                }

                this.triggerEvent(this.getSynthesis().events.SYNTHESIS_START);

                if (callbacks) {
                    if (typeof (callbacks.onStart) == "function") {
                        callbacks.onStart.call(msg);
                    }
                }
            });
        }

        if ((actualChunk) >= totalChunks) {
            msg.addEventListener('end', () => {
                // not speaking status
                this.getSynthesis().isSpeaking = false;

                if(this.isDebug()) {
                    this.console('Event reached : ' + this.getSynthesis().events.SYNTHESIS_END);

                }

                this.triggerEvent(this.getSynthesis().events.SYNTHESIS_END);

                // Trigger the onEnd callback if exists.
                if (callbacks) {
                    if (typeof (callbacks.onEnd) == 'function') {
                        callbacks.onEnd.call(msg);
                    }
                }
            });
        }

        if(this.isDebug()) {
            this.console((actualChunk) + 'text chunk processed succesfully out of ' + totalChunks);
        }

        // Важно: сохранить объект SpeechSynthesisUtterance в памяти, иначе он потеряется
        this.getSynthesis().garbageCollection.push(msg);
        window.speechSynthesis.speak(msg);
    }

    /**
     *
     * @param message
     * @param callbacks
     * @returns {*}
     */
    say(message, callbacks) {
        let sayMaxChunkLength = 115;
        let definitive = [];

        if (this.synthesisSupported()) {
            if (typeof (message) != 'string') {
                return this.console('Celebrimbor expects a string to speak " + typeof message + " given', 'warn');
            }

            if (!message.length) {
                return this.console('Cannot speak empty string', 'warn');
            }

            // Если текст длинный - разделяем его
            if (message.length > sayMaxChunkLength) {
                // Разделите данный текст, сделав паузу, читая символы [",", ":", ";", "."], чтобы обеспечить естественное ощущение чтения.
                let naturalReading = message.split(/,|:|\. |;/);
                naturalReading.forEach((chunk, index) => {
                    // Если предложение слишком велико и может блокировать API, разделяем его, чтобы предотвратить любые ошибки.
                    if (chunk.length > sayMaxChunkLength) {
                        // Обработать строку в строках (внутри массива) максимум ок. 115 символов, чтобы предотвратить ошибки в API.                        let temp_processed = this.splitStringByChunks(chunk, sayMaxChunkLength);
                        // Добавьте элементы обработанного предложения в окончательный фрагмент.
                        definitive.push.apply(definitive, temp_processed);
                    } else {
                        // В противном случае просто добавляем предложение к разговору.
                        definitive.push(chunk);
                    }
                });
            } else {
                definitive.push(message);
            }

            // Очистить любой пустой элемент в массиве
            definitive = definitive.filter((e) => {
                return e;
            });

            // Приступаем к обсуждению кусков и назначению обратных вызовов.
            definitive.forEach((chunk, index) => {
                let numberOfChunk = (index + 1);
                if (chunk) {
                    this.speak(chunk, numberOfChunk, definitive.length, callbacks);
                }
            });

            // Сохранить устный текст в объекте lastSay
            this.getSynthesis().helpers.lastSay = {
                text: message,
                date: new Date()
            };
        }
    }

    /**
     *
     * @param input
     * @param chunk_length
     * @returns {Array}
     */
    splitStringByChunks(input, chunk_length) {

        input = input || "";
        chunk_length = chunk_length || 100;

        let curr = chunk_length;
        let prev = 0;
        let output = [];

        while (input[curr]) {
            if (input[curr++] == ' ') {
                output.push(input.substring(prev, curr));
                prev = curr;
                curr += chunk_length;
            }
        }

        output.push(input.substr(prev));
        return output;
    }

    /**
     *
     * @returns {boolean}
     */
    synthesisSupported() {
        return 'speechSynthesis' in window;
    }

    getVoice(languageCode) {
        let voiceIdentifiersArray = this.getSynthesis().voices[languageCode];

        if (!voiceIdentifiersArray) {
            this.console('The providen language ' + languageCode + ' isn\'t available, using English Great britain as default');
            voiceIdentifiersArray = this.getSynthesis().voices["en-GB"];
        }

        let voice = undefined;
        let voices = speechSynthesis.getVoices();
        let voicesLength = voiceIdentifiersArray.length;

        let _lo = (i) => {
            let foundVoice = voices.filter((voice) => {
                return ((voice.name == voiceIdentifiersArray[i]) || (voice.lang == voiceIdentifiersArray[i]));
            })[0];

            if (foundVoice) {
                voice = foundVoice;
                return 'break';
            }
        };

        for (let i = 0; i < voicesLength; i++) {
            let state_1 = _lo(i);
            if (state_1 === 'break')
                break;
        }
        return voice;
    }

    /**
     *
     * @returns {*|Array}
     */
    getVoices() {
        return window.speechSynthesis.getVoices();
    }

    /**
     *
     * @returns {Celebrimbor.celebrimbor.properties.synthesis|{voices, voice, helpers, events, isSpeaking, garbageCollection, speed, volume, obeying, soundex, name}}
     */
    getSynthesis() {
        return this.getProps().synthesis;
    }
}