export { CATEGORIES, def } from "./def.ts";
export type { Entry, Category } from "./def.ts";
import type { Entry } from "./def.ts";

import ui from "./ui.ts";
import pickup from "./pickup.ts";
import jump from "./jump.ts";
import hit from "./hit.ts";
import explosion from "./explosion.ts";
import powerup from "./powerup.ts";
import shoot from "./shoot.ts";
import footstep from "./footstep.ts";
import magic from "./magic.ts";
import alert from "./alert.ts";
import jingle from "./jingle.ts";
import mechanic from "./mechanic.ts";
import world from "./world.ts";

export const library: Entry[] = [...ui, ...pickup, ...jump, ...hit, ...explosion, ...powerup, ...shoot, ...footstep, ...magic, ...alert, ...jingle, ...mechanic, ...world];
