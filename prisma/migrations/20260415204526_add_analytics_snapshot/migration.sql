-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" UUID NOT NULL,
    "metric_name" VARCHAR(50) NOT NULL,
    "agent_id" UUID,
    "value" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_snapshots_metric_name_agent_id_timestamp_idx" ON "analytics_snapshots"("metric_name", "agent_id", "timestamp");
