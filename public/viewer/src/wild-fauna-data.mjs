export const DEER_KINDS=Object.freeze(['mother_deer','stag','baby_deer']);
export const PIG_KINDS=Object.freeze(['pig','pig_spotted']);
export const PEACEFUL_FAUNA_KINDS=Object.freeze([...DEER_KINDS,...PIG_KINDS]);
export const WILD_FAUNA_KINDS=Object.freeze([...PEACEFUL_FAUNA_KINDS,'scorpion','arctic_fox']);
export const WILD_FAUNA_LIMIT=8;
export const WILD_FAUNA_DEFAULTS=Object.freeze({
 mother_deer:{name:'Mother deer',hp:52,speed:108,damage:0,faction:'neutral'},
 stag:{name:'Antlered stag',hp:74,speed:116,damage:0,faction:'neutral'},
 baby_deer:{name:'Baby deer',hp:24,speed:106,damage:0,faction:'neutral'},
 pig:{name:'Pink wild pig',hp:48,speed:92,damage:0,faction:'neutral'},
 pig_spotted:{name:'Brown spotted pig',hp:48,speed:92,damage:0,faction:'neutral'},
 scorpion:{name:'Desert scorpion',hp:34,speed:38,damage:10,faction:'enemy'},
 arctic_fox:{name:'Arctic fox',hp:42,speed:86,damage:8,faction:'enemy'},
});
