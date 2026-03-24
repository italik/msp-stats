import { z } from "zod";
import { snapshotSchema } from "./schema";

export type Snapshot = z.infer<typeof snapshotSchema>;
