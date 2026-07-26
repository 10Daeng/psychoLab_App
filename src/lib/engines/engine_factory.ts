import { BaseTestEngine } from './base_engine';
import { CpmEngine } from './cpm_engine';
import { ParentQEngine } from './parent_q_engine';
import { RiasecEngine } from './riasec_engine';
import { DiscEngine } from './disc_engine';
import { HexacoEngine } from './hexaco_engine';
import { Raven2Engine } from './raven2_engine';
import { VakEngine } from './vak_engine';
import { WviEngine } from './wvi_engine';

export class EngineFactory {
  static getEngine(testCode: string): BaseTestEngine {
    switch (testCode.toUpperCase()) {
      case 'CPM':
        return new CpmEngine();
      case 'PARENT_Q':
        return new ParentQEngine();
      case 'SDS':
      case 'RIASEC':
        return new RiasecEngine();
      case 'DISC':
        return new DiscEngine();
      case 'HEXACO':
        return new HexacoEngine();
      case 'RAVEN2':
        return new Raven2Engine();
      case 'VAK':
        return new VakEngine();
      case 'WVI':
        return new WviEngine();
      default:
        throw new Error(`Engine for test code ${testCode} is not implemented yet.`);
    }
  }
}
