import mongoose, { Schema, Model } from "mongoose";

interface IRegistrationRateLimit {
  gameId: mongoose.Types.ObjectId;
  ipHash: string;
  windowStart: Date;
  count: number;
  expiresAt: Date;
}

const RegistrationRateLimitSchema = new Schema<IRegistrationRateLimit>({
  gameId: { type: Schema.Types.ObjectId, required: true, index: true },
  ipHash: { type: String, required: true },
  windowStart: { type: Date, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
RegistrationRateLimitSchema.index(
  { gameId: 1, ipHash: 1, windowStart: 1 },
  { unique: true },
);

const RegistrationRateLimit: Model<IRegistrationRateLimit> =
  mongoose.models.RegistrationRateLimit ||
  mongoose.model<IRegistrationRateLimit>(
    "RegistrationRateLimit",
    RegistrationRateLimitSchema,
  );
export default RegistrationRateLimit;
