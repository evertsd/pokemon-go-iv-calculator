'use strict'

const Pokemon = require('../json/pokemon.json')
const LevelToCPM = require('../json/level-to-cpm.json')
const CPM = require('../json/cpm.json')
const DustToLevel = require('../json/dust-to-level')

const cpTools = require('./cp')
const hpTools = require('./hp')
const powerupTools = require('./powerup')

const TRAINER_LEVEL = 26

class GuessIVs {
  constructor(pokemon, mon, ECpM, trainerLevel = 30) {
    this.pokemon = pokemon;
    this.mon = mon;
    this.ECpM = ECpM;
    this.tranerLevel = trainerLevel;

    const maxLevel = pokemon.level || Math.max.apply(null, DustToLevel[pokemon.stardust])
    const powerup = powerupTools.howMuchPowerUp(maxLevel, trainerLevel)

    this.baseMetadata = {
      Stardust: powerup.stardust,
      Candy: powerup.candy,
      MinLevelCP: cpTools.getMinCPForLevel(mon, ECpM),
      MaxLevelCP: cpTools.getMaxCPForLevel(mon, ECpM),
      MinLevelHP: hpTools.getMinHPForLevel(mon, ECpM),
      MaxLevelHP: hpTools.getMaxHPForLevel(mon, ECpM),
      MaxLeveledCP: cpTools.getMaxCPForLevel(mon, this.getMaxLevel()),
      MaxLeveledHP: hpTools.getMaxHPForLevel(mon, this.getMaxLevel()),
    };

    this.basePercentages = {
      PercentHP: Math.round(this.percentInRange(
        pokemon.hp, this.baseMetadata.MinLevelHP, this.baseMetadata.MaxLevelHP
      )),
      PercentCP: Math.round(this.percentInRange(
        pokemon.cp, this.baseMetadata.MinLevelCP, this.baseMetadata.MaxLevelCP
      )),
    };
  }

  getMaxLevel() {
    return LevelToCPM[String(this.trainerLevel + 1.5)];
  }

  percentInRange(num, min, max) {
    return ((num - min) * 100) / (max - min)
  }

  calcIndSta() {
    const BaseSta = this.mon.stats.stamina;
    const hp = this.pokemon.hp;

    return Array.from(Array(16))
      .map((_, i) => i)
      .filter(IndSta => hp === Math.floor(this.ECpM * (BaseSta + IndSta)))
  }

  getAttackPercentage(IndAtk, IndDef) {
    return Math.round((IndAtk + IndDef) / 30 * 100)
  }

  possibleValues() {
    var values = [];

    const IndStaValues = this.calcIndSta();

    // Brute force find the IVs.
    // For every possible IndSta we'll loop through IndAtk and IndDef until we
    // find CPs that match your Pokemon's CP. Those are possible matches and are
    // returned by this function.
    IndStaValues.forEach((IndSta) => {
      for (let IndAtk = 0; IndAtk <= 15; IndAtk += 1) {
        for (let IndDef = 0; IndDef <= 15; IndDef += 1) {
          if (this.ivIsMatch(IndDef, IndAtk, IndSta)) {
            values.push(this.buildIv(IndDef, IndAtk, IndSta));
          }
        }
      }
    });

    return values;
  }

  ivIsMatch(IndDef, IndAtk, IndSta) {
    const CP = cpTools.getCP(this.mon, {
      atk: IndAtk,
      def: IndDef,
      sta: IndSta,
    }, this.ECpM);

    return this.pokemon.cp === CP;
  }

  buildIv(IndDef, IndAtk, IndSta) {
    const Name = this.pokemon.name.toUpperCase();
    const Level = Object.keys(LevelToCPM).reduce((lvl, key) => {
      if (LevelToCPM[key] === this.ECpM) {
        return key
      }
      return lvl
    }, null);
    const CP = this.pokemon.cp;
    const HP = this.pokemon.hp;

    const BaseAtk = this.mon.stats.attack;
    const Atk = (BaseAtk + IndAtk) * this.ECpM

    const BaseDef = this.mon.stats.defense
    const Def = (BaseDef + IndDef) * this.ECpM

    const BaseSta = this.mon.stats.stamina
    const Sta = (BaseSta + IndSta) * this.ECpM

    const MaxCP = cpTools.getMaxCP(this.mon, IndAtk, IndDef, IndSta, this.getMaxLevel())
    const MaxHP = hpTools.getMaxHP(this.mon, IndSta, this.getMaxLevel())

    const PerfectIV = Math.round((IndAtk + IndDef + IndSta) / 45 * 100)
    const PercentBatt = this.getAttackPercentage(IndAtk, IndDef)

    var EvolveCP = null
    var MaxEvolveCP = null

    if (CPM[Name]) {
      EvolveCP = Math.floor(CPM[Name][1] * CP / 100) * 100
      MaxEvolveCP = Math.floor(CPM[Name][1] * MaxCP / 100) * 100
    }

    return {
      Name, Level, CP, HP,
      Atk, Def, Sta, ECpM: this.ECpM,
      ivs: {
        IndAtk,
        IndDef,
        IndSta,
      },
      percent: Object.assign(this.basePercentages, {
        PercentBatt: PercentBatt,
        PerfectIV: PerfectIV
      }),
      meta: Object.assign(this.baseMetadata, {
        EvolveCP: EvolveCP,
        MaxEvolveCP: MaxEvolveCP,
        MaxCP: MaxCP,
        MaxHP, MaxHP
      })
    };
  }
}

module.exports = GuessIVs
