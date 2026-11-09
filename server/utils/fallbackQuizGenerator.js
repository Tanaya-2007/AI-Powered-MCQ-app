import { validateStudyText } from './validation.js';
/**
 * Resilient Fallback Quiz Generator (Backend Edition)
 * Used by /api/generate-quiz when third-party AI keys encounter quotas,
 * 401/403 authorization failures, or external API timeouts.
 */

const TOPIC_KNOWLEDGE_BASE = {
  'system design': [
    {
      question: 'Which component is primarily responsible for distributing incoming client traffic across multiple servers in a distributed architecture?',
      options: ['Load Balancer', 'Message Queue', 'Reverse Proxy Cache', 'Database Read Replica'],
      correctAnswer: 0,
      explanation: 'Load balancers sit between clients and backend servers to evenly distribute traffic, improving availability, fault tolerance, and responsiveness.'
    },
    {
      question: 'According to the CAP theorem, which combination is IMPOSSIBLE to achieve simultaneously in a distributed data store experiencing network partitions?',
      options: ['Both Consistency and Availability', 'Consistency and Partition Tolerance', 'Availability and Partition Tolerance', 'Eventual Consistency and Latency'],
      correctAnswer: 0,
      explanation: 'The CAP theorem states that in the event of a network partition (P), a distributed system must choose between Consistency (C) and Availability (A).'
    },
    {
      question: 'What is the primary purpose of introducing a caching layer (e.g. Redis, Memcached) into a system architecture?',
      options: ['Reducing database read latency and offloading heavy queries', 'Replacing persistent disk storage permanently', 'Handling TLS/SSL termination exclusively', 'Managing distributed transactions across microservices'],
      correctAnswer: 0,
      explanation: 'In-memory caches store frequently requested data close to the application layer to achieve sub-millisecond retrieval and reduce load on primary databases.'
    },
    {
      question: 'Which database scaling approach involves splitting rows of a single database table across multiple separate database instances?',
      options: ['Horizontal Sharding', 'Vertical Scaling (Scale-Up)', 'Master-Slave Replication', 'Normalization to 3NF'],
      correctAnswer: 0,
      explanation: 'Sharding is a horizontal partitioning technique where subsets of dataset rows are distributed across multiple independent database servers using a shard key.'
    },
    {
      question: 'In an event-driven microservices architecture, what role does a message broker (e.g., Apache Kafka, RabbitMQ) play?',
      options: ['Decoupling producers and consumers through asynchronous messaging', 'Providing synchronous blocking RPC communication', 'Serving static web assets directly to end users', 'Enforcing SQL schema constraints across services'],
      correctAnswer: 0,
      explanation: 'Message brokers decouple microservices by allowing producers to publish messages asynchronously without waiting for consumers to process them immediately.'
    },
    {
      question: 'What is the key advantage of a Content Delivery Network (CDN) in global system architecture?',
      options: ['Serving static content from edge servers geographically closest to users', 'Running heavy background batch processing jobs', 'Executing centralized ACID database migrations', 'Encrypting local storage partitions on client devices'],
      correctAnswer: 0,
      explanation: 'CDNs cache static assets across edge servers to reduce latency for globally distributed users.'
    },
    {
      question: 'Which caching strategy writes data directly to both the cache and the underlying database simultaneously before confirming success?',
      options: ['Write-Through Cache', 'Write-Back (Write-Behind) Cache', 'Write-Around Cache', 'Cache-Aside (Lazy Loading)'],
      correctAnswer: 0,
      explanation: 'In a write-through cache, writes are executed concurrently on both cache and persistent store, guaranteeing consistency at the cost of higher write latency.'
    },
    {
      question: 'What is the purpose of implementing a "Circuit Breaker" pattern in a microservices ecosystem?',
      options: ['Preventing cascading failures by failing fast when a downstream dependency is degraded', 'Automatically scaling up compute instances during flash traffic', 'Validating JWT authentication tokens on incoming requests', 'Routing WebSocket handshakes to dedicated instances'],
      correctAnswer: 0,
      explanation: 'Circuit breakers prevent an application from repeatedly trying to execute an operation that is failing, allowing the downstream service time to recover.'
    },
    {
      question: 'What is the primary difference between horizontal scaling and vertical scaling?',
      options: ['Horizontal scaling adds more machines; vertical scaling adds more CPU/RAM to an existing machine', 'Horizontal scaling increases CPU frequency; vertical scaling distributes network load', 'Horizontal scaling is only used for databases; vertical scaling is for web servers', 'Horizontal scaling cannot support stateless services'],
      correctAnswer: 0,
      explanation: 'Horizontal scaling adds more instances to a cluster, whereas vertical scaling upgrades the physical hardware of a single machine.'
    },
    {
      question: 'In distributed databases, what does "Eventual Consistency" guarantee?',
      options: ['If no new updates are made, all replicas will eventually return the latest value', 'Every read operation is immediately guaranteed to return the most recent write', 'All database nodes execute queries in lockstep using two-phase commit', 'Data is replicated synchronously across at least three cloud regions'],
      correctAnswer: 0,
      explanation: 'Eventual consistency guarantees that all replicas will eventually synchronize and return identical data in the absence of new write operations.'
    }
  ],
  'operating systems': [
    {
      question: 'What is the primary function of the Operating System kernel?',
      options: ['Managing hardware resources and providing core abstractions for processes', 'Formatting graphical user interface window styles', 'Compiling high-level programming code into binaries', 'Rendering web pages inside client browser engines'],
      correctAnswer: 0,
      explanation: 'The kernel is the central core of an operating system, managing CPU scheduling, memory allocation, and hardware device drivers.'
    },
    {
      question: 'Which condition is NOT one of Coffman’s four necessary conditions for a deadlock to occur?',
      options: ['Preemptive scheduling by the kernel', 'Mutual exclusion', 'Hold and wait', 'Circular wait'],
      correctAnswer: 0,
      explanation: 'Deadlock requires NO preemption; preemptive scheduling allows the OS to reclaim resources and prevent deadlocks.'
    },
    {
      question: 'What is the primary purpose of virtual memory in modern operating systems?',
      options: ['Providing an isolated, contiguous address space for each process using disk as backing store', 'Increasing physical CPU register speeds', 'Permanently storing file system directories on flash drives', 'Allowing user space programs to write directly to hardware registers'],
      correctAnswer: 0,
      explanation: 'Virtual memory isolates processes from each other and allows systems to run programs that exceed physical RAM capacity.'
    },
    {
      question: 'What happens during a CPU "context switch"?',
      options: ['Saving the state of the active process and restoring the state of the next scheduled process', 'Switching the power supply state between standby and active mode', 'Recompiling an application during runtime execution', 'Clearing the entire contents of the hard drive cache'],
      correctAnswer: 0,
      explanation: 'A context switch saves the CPU registers and program counter into the active process control block (PCB) and loads the state of the next task.'
    },
    {
      question: 'Which CPU scheduling algorithm is non-preemptive and executes processes in the exact order of their arrival?',
      options: ['First-Come, First-Served (FCFS)', 'Round Robin (RR)', 'Shortest Remaining Time First (SRTF)', 'Multi-Level Feedback Queue'],
      correctAnswer: 0,
      explanation: 'FCFS schedules tasks strictly in the order they arrive in the ready queue without preemption.'
    }
  ]
};

function generateDynamicQuestions(text, count, difficulty, topicTitle) {
  const safeTitle = topicTitle || 'Study Material';
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/[.?!]\s+/).filter(s => s.trim().length >= 25 && s.trim().length <= 250);

  const questions = [];

  for (let i = 0; i < sentences.length && questions.length < count; i++) {
    const s = sentences[i].trim();
    const words = s.split(' ');
    const candidates = words.filter(w => /^[A-Z][a-z]{3,}/.test(w) || w.length >= 7);
    if (candidates.length === 0) continue;

    const targetWord = candidates[Math.floor(candidates.length / 2)].replace(/[^a-zA-Z0-9_-]/g, '');
    if (!targetWord || targetWord.length < 3) continue;

    const blanked = s.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '_______');
    if (blanked === s) continue;

    const options = [
      targetWord,
      targetWord + ' protocol',
      'alternative ' + targetWord,
      'inverse ' + targetWord
    ].sort(() => Math.random() - 0.5);

    questions.push({
      question: `According to the study material on "${safeTitle}", complete: "${blanked}"`,
      options,
      correctAnswer: options.indexOf(targetWord),
      explanation: `Based on your provided study material: "${s}."`,
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: s
    });
  }

  const genericConcepts = [
    {
      q: (t) => `What is the core objective or primary purpose of "${t}" in modern computer science & engineering?`,
      a: (t) => `Providing structured architectural patterns and foundational principles for ${t}`,
      d: [
        'Eliminating all computational resource requirements',
        'Replacing standard hardware protocols with unverified scripts',
        'Restricting execution to single-core offline systems'
      ],
      e: (t) => `The fundamental focus of ${t} centers on core principles, systematic design, and structured domain knowledge.`
    },
    {
      q: (t) => `In the context of "${t}", which of the following represents a primary operational trade-off?`,
      a: () => 'Balancing throughput latency and fault-tolerance against infrastructure complexity',
      d: [
        'Sacrificing correctness for non-deterministic random results',
        'Assuming unbounded zero-cost storage at all scales',
        'Disabling all telemetry and security monitoring'
      ],
      e: (t) => `Engineering decisions in ${t} continuously balance throughput, reliability, and architectural complexity.`
    },
    {
      q: (t) => `Which standard practice is recommended when architecting solutions for "${t}"?`,
      a: () => 'Systematic decomposition into modular components with well-defined contracts',
      d: [
        'Coupling all logic into an undocumented monolithic file',
        'Bypassing automated test suites before deploying',
        'Hardcoding environment-specific secrets into client bundles'
      ],
      e: (t) => `Best practices in ${t} emphasize modularity, separation of concerns, and verifiable component interfaces.`
    },
    {
      q: (t) => `What is a common architectural challenge encountered when scaling "${t}"?`,
      a: () => 'Managing concurrency, state consistency, and distributed boundary latency',
      d: [
        'Eliminating the need for storage persistence completely',
        'Guaranteeing infinite computation at zero latency',
        'Preventing any client-side network connectivity'
      ],
      e: (t) => `Scalability in ${t} centers on handling concurrent access, state consistency, and reliable network boundaries.`
    },
    {
      q: (t) => `Which principle is critical for ensuring high availability and fault tolerance in "${t}"?`,
      a: () => 'Redundancy, graceful degradation, and defensive error containment',
      d: [
        'Crashing the entire application immediately upon any warning',
        'Suppressing all error logs to reduce disk writes',
        'Allocating memory without backpressure controls'
      ],
      e: (t) => `Resilience in ${t} is achieved through redundancy, circuit breaking, and defensive failure isolation.`
    }
  ];

  let idx = 0;
  while (questions.length < count) {
    const item = genericConcepts[idx % genericConcepts.length];
    const correct = item.a(safeTitle);
    const options = [correct, ...item.d].sort(() => Math.random() - 0.5);

    questions.push({
      question: item.q(safeTitle),
      options,
      correctAnswer: options.indexOf(correct),
      explanation: item.e(safeTitle),
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: `Core educational principles of ${safeTitle}`
    });
    idx++;
  }

  return questions.slice(0, count);
}

export function generateResilientQuiz(topic, count = 10, difficulty = 'medium', contextText = '') {
  const targetCount = Math.min(50, Math.max(1, Number(count) || 10));
  const normalizedTopic = String(topic || '').trim().toLowerCase();

  // Validate topic/notes: never generate questions for non-academic queries
  const validation = validateStudyText(contextText || topic);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  for (const [key, bank] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    const isMatch = normalizedTopic === key || new RegExp(`(^|\\b)${key}(\\b|$)`, 'i').test(normalizedTopic);
    if (isMatch) {
      const selected = bank.slice(0, targetCount).map((q) => ({
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: difficulty || 'medium',
        topic: topic || key,
        sourceReference: `Fundamental Principles of ${topic || key}`
      }));

      if (selected.length < targetCount) {
        const extra = generateDynamicQuestions(contextText || topic, targetCount - selected.length, difficulty, topic);
        selected.push(...extra);
      }
      return selected;
    }
  }

  return generateDynamicQuestions(contextText || topic, targetCount, difficulty, topic);
}
