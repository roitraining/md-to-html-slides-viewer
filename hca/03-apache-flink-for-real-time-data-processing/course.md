<!-- course-title: HCA: Apache Flink for Real-Time Data -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Apache Flink for
# Real-Time Data Processing

## Streams, state, windows, and where Flink fits in modern pipelines

---

# Welcome!

- ROI leads the industry in designing and delivering customized technology and management training solutions
- Meet your instructor
  - Name
  - Background
  - Contact info
- Let’s get started!

![Welcome](images/welcome.png)
---

# Course Objectives

- **Explain how Apache Flink enables low-latency stream processing** in a modern data architecture
- Explain real-time stream processing and how it differs from batch
- Describe Flink’s core concepts: streams, state, windows, and event time
- Identify common real-time use cases suited to Flink
- Recognize how Flink fits alongside messaging and storage in a pipeline

---

# Agenda

- Segment 1: Streaming Fundamentals (~20 min)
- Segment 2: Flink Core Concepts (~25 min)
- Segment 3: Putting It to Work (~15 min)
- Q&A (~15 min)

![Agenda](images/agenda.png)
---

# Who Should Attend

- Data engineers building continuous pipelines
- Architects designing real-time platforms
- Platform engineers operating streaming infrastructure
- Analytics engineers moving from batch-only workloads

![Who Should Attend](images/who-should-attend.png)
---

# Prerequisites

- Familiarity with software development fundamentals
- Comfort reading APIs, logs, and simple code samples
- Generative AI basics (as required by your program track)
- Helpful: prior exposure to Kafka, Pub/Sub, or data warehouses

![Prerequisites](images/prerequisites.png)
---
<!-- layout: navigation -->
# Course Roadmap

- **Streaming Fundamentals**
- Flink Core Concepts
- Putting It to Work

---

# Why Real-Time Matters

- Businesses increasingly need **seconds**, not overnight batches
- Detect fraud, outages, and user issues while they are happening
- Power live dashboards, personalization, and operational alerts
- Continuous data is already flowing—batch is a delayed snapshot

> [!NOTE]
> “Real-time” is a product requirement (latency budget), not a buzzword. Define the SLA first.

---
<!-- layout: title-image -->
# Batch vs. Stream

![Batch vs stream](images/batch-vs-stream.png)

---
<!-- layout: 2-column -->
# Latency and Throughput

### Latency
- Time from event → useful result
- Fraud: milliseconds–seconds
- Daily report: hours is fine

### Throughput
- Events processed per second
- Streaming systems scale both
- Optimize for your bottleneck

---

# What Is Apache Flink?

- Open-source **stateful stream processing** engine
- Runs continuous jobs over unbounded data
- Strong model for **event time**, **windows**, and **fault-tolerant state**
- APIs for Java/Scala (DataStream) and SQL/Table for many teams

> [!TIP]
> Think of Flink as the compute layer for streams—similar to how Spark often serves batch/lakehouse compute.

---
<!-- layout: title-image -->
# Where Flink Sits in the Ecosystem

![Flink pipeline architecture](images/flink-pipeline-architecture.png)

---
<!-- layout: 3-column -->
# Flink vs. Adjacent Tools

### Messaging
- Kafka / Pub/Sub / Pulsar
- Transport & buffer
- Not heavy compute

### Flink
- Stateful transforms
- Windows & joins
- Exactly-once sinks*

### Storage
- Warehouse / lake / OLTP
- Durable history
- Serving & analytics

---
<!-- layout: navigation -->
# Course Roadmap

- Streaming Fundamentals
- **Flink Core Concepts**
- Putting It to Work

---
<!-- layout: title-image -->
# How Flink Works: Building Blocks

![Flink core concepts](images/flink-core-concepts.png)

---

# Streams

- A **stream** is an unbounded sequence of events
- Events often carry a key (user_id, device_id, account_id)
- Operators transform streams: map, filter, keyBy, join, window
- Jobs run until cancelled—there is no natural “end of file”

```text
clicks  →  filter(bot?)  →  keyBy(user)  →  window(5m)  →  counts
```

---
<!-- layout: 2-column -->
# State: Memory Across Events

### Why State Exists
- Count per user so far
- Last seen transaction
- Session in progress
- Model features online

### Flink Responsibilities
- Local keyed state
- Checkpoint to durable store
- Restore after failure
- Scale with keyed parallelism

---

# Windowing

- Windows **slice** an unbounded stream into finite buckets
- Common types: tumbling, sliding, session
- Aggregations (sum, count, avg) usually happen **inside** a window
- Choose windows from the business question, not from habit

| Window | Idea | Example |
| :--- | :--- | :--- |
| Tumbling | Fixed, non-overlapping | Count orders every 1 minute |
| Sliding | Fixed, overlapping | 5-minute fraud score every 1 minute |
| Session | Gap-based | User browse session until idle |

---
<!-- layout: title-image -->
# Event Time vs. Processing Time

![Event time vs processing time](images/event-time-vs-processing-time.png)

---

# Watermarks and Late Data

- **Watermarks** estimate how far event time has progressed
- They let windows close even when data arrives out of order
- Late events can still be allowed within a configured lateness
- Wrong time semantics → wrong dashboards and wrong alerts

> [!IMPORTANT]
> For correctness under delay and reordering, prefer **event time** + watermarks over processing time.

---
<!-- layout: 2-column -->
# Mental Model: A Flink Job

### Sources
- Kafka topic / Pub/Sub
- Files, sockets (dev)
- CDC streams

### Operators → Sink
- Stateful keyed logic
- Windows & timers
- Write to DB, lake, alert bus

---

# Example: A Simple Flink Stream Job

- Read a stream of purchase events (amount + event-time timestamp)
- `keyBy` customer so each user’s state is processed independently
- Tumbling **event-time** windows (1 minute) sum spend per customer
- Print results—same shape as writing to Kafka, a DB, or a lake sink

```java
public class SimplePurchaseSumJob {
    public static void main(String[] args) throws Exception {
        // Local env for demos; on a cluster you'd use getExecutionEnvironment()
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.createLocalEnvironment();

        DataStream<Purchase> purchases = env
            .addSource(new PurchaseSource()) // Kafka/Pub/Sub in production
            // Event time + watermarks: Flink advances "time" from the data,
            // not the wall clock—so late events are handled correctly
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<Purchase>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                    .withTimestampAssigner((event, ts) -> event.getEventTimeMillis())
            );

        purchases
            .keyBy(Purchase::getCustomerId)           // partition state by customer
            .window(TumblingEventTimeWindows.of(Time.minutes(1)))
            .aggregate(new SumAmounts())              // stateful window aggregation
            .map(result -> String.format(
                "customer=%s windowEnd=%s total=%.2f",
                result.getCustomerId(),
                result.getWindowEnd(),
                result.getTotal()
            ))
            .print();                                 // replace with a real sink later

        env.execute("simple-purchase-sum");
    }
}
```

---
<!-- layout: navigation -->
# Course Roadmap

- Streaming Fundamentals
- Flink Core Concepts
- **Putting It to Work**

---
<!-- layout: title-image -->
# Common Real-Time Use Cases

![Flink use cases](images/flink-use-cases.png)

---
<!-- layout: 3-column -->
# Pattern Snapshots

### Fraud / Risk
- Score each event live
- Enrich with recent history
- Route high-risk to review

### Telemetry
- Roll up metrics
- Detect anomalies
- Feed SLO / ops views

### Alerting
- Threshold & composite rules
- Deduplicate noise
- Trigger tickets / pages

---

# Integration: Messaging In, Sinks Out

- **Ingress:** Kafka, Google Pub/Sub, Kinesis, Pulsar
- **Egress:** warehouses, lakes, OLTP, search, notification topics
- Design for **replay**: keep source offsets and idempotent sinks
- Separate “speed layer” results from long-term analytical storage when needed

> [!WARNING]
> A Flink job is only as reliable as its checkpoint storage, restart strategy, and sink semantics.

---
<!-- layout: 2-column -->
# Architecture Checklist

### Fit for Flink
- Continuous events
- Stateful decisions
- Sub-minute latency
- Complex event logic

### Consider Alternatives
- Pure batch / micro-batch OK
- Simple filter at the broker
- Request/response APIs only
- Tiny volume, rare jobs

---

# Putting It Together

```text
Producers → Kafka/Pub/Sub → Flink (stateful jobs)
                              ├─→ Alerting / Actions
                              ├─→ Serving DB / Cache
                              └─→ Lakehouse / Warehouse
```

- Flink owns **compute + state** for the stream path
- Messaging owns **durable transport and fan-out**
- Storage owns **history, BI, and downstream ML features**

---

# What You Learned

- Explained real-time stream processing and how it differs from batch
- Described Flink’s core concepts: streams, state, windows, and event time
- Identified common real-time use cases suited to Flink
- Recognized how Flink fits alongside messaging and storage in a pipeline

---
<!-- layout: title-image -->
# Q&A

![Questions](images/qa.png)
