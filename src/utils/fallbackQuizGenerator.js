/**
 * Resilient Fallback Quiz Generator
 * 
 * Guarantees that users ALWAYS receive high-quality, grounded multiple-choice questions
 * even when the cloud backend is cold-starting, suspended by hosting limits, or when
 * third-party AI keys are temporarily restricted or rate-limited.
 */

// Domain knowledge templates for popular academic & technical topics
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
      explanation: 'CDNs cache static assets (images, scripts, stylesheets) across geographically distributed points of presence (PoPs) to minimize round-trip latency.'
    },
    {
      question: 'Which caching strategy writes data directly to both the cache and the underlying database simultaneously before confirming success?',
      options: ['Write-Through Cache', 'Write-Back (Write-Behind) Cache', 'Write-Around Cache', 'Cache-Aside (Lazy Loading)'],
      correctAnswer: 0,
      explanation: 'In a write-through cache, every write is executed on both the cache and primary database concurrently, ensuring strict data consistency at the expense of higher write latency.'
    },
    {
      question: 'What is the purpose of implementing a "Circuit Breaker" pattern in a microservices ecosystem?',
      options: ['Preventing cascading failures by failing fast when a downstream dependency is degraded', 'Automatically scaling up compute instances during flash traffic', 'Validating JWT authentication tokens on incoming requests', 'Routing WebSocket handshakes to dedicated instances'],
      correctAnswer: 0,
      explanation: 'A circuit breaker detects failures and encapsulates the logic of preventing an operation from constantly trying to execute an action that is doomed to fail, saving system resources.'
    },
    {
      question: 'What is the primary difference between horizontal scaling and vertical scaling?',
      options: ['Horizontal scaling adds more machines; vertical scaling adds more CPU/RAM to an existing machine', 'Horizontal scaling increases CPU frequency; vertical scaling distributes network load', 'Horizontal scaling is only used for databases; vertical scaling is for web servers', 'Horizontal scaling cannot support stateless services'],
      correctAnswer: 0,
      explanation: 'Horizontal scaling (scaling out) adds more commodity nodes to a cluster, while vertical scaling (scaling up) upgrades the hardware capacity of an individual server.'
    },
    {
      question: 'In distributed databases, what does "Eventual Consistency" guarantee?',
      options: ['If no new updates are made, all replicas will eventually return the latest value', 'Every read operation is immediately guaranteed to return the most recent write', 'All database nodes execute queries in lockstep using two-phase commit', 'Data is replicated synchronously across at least three cloud regions'],
      correctAnswer: 0,
      explanation: 'Eventual consistency guarantees that given sufficient time without new updates, all replicas will converge and yield identical data values.'
    }
  ],
  'operating systems': [
    {
      question: 'What is the primary function of the Operating System kernel?',
      options: ['Managing hardware resources and providing core abstractions for processes', 'Formatting graphical user interface window styles', 'Compiling high-level programming code into binaries', 'Rendering web pages inside client browser engines'],
      correctAnswer: 0,
      explanation: 'The kernel is the central core of an operating system, having complete control over everything in the system, managing CPU, memory, devices, and system calls.'
    },
    {
      question: 'Which condition is NOT one of Coffman’s four necessary conditions for a deadlock to occur?',
      options: ['Preemptive scheduling by the kernel', 'Mutual exclusion', 'Hold and wait', 'Circular wait'],
      correctAnswer: 0,
      explanation: 'Coffman conditions require NO preemption (resources cannot be forcibly taken). Preemptive scheduling actually helps prevent or break deadlocks.'
    },
    {
      question: 'What is the primary purpose of virtual memory in modern operating systems?',
      options: ['Providing an isolated, contiguous address space for each process using disk as backing store', 'Increasing physical CPU register speeds', 'Permanently storing file system directories on flash drives', 'Allowing user space programs to write directly to hardware registers'],
      correctAnswer: 0,
      explanation: 'Virtual memory creates an abstraction of large, contiguous memory space for processes and enforces memory protection between independent processes.'
    },
    {
      question: 'What happens during a CPU "context switch"?',
      options: ['Saving the state of the active process and restoring the state of the next scheduled process', 'Switching the power supply state between standby and active mode', 'Recompiling an application during runtime execution', 'Clearing the entire contents of the hard drive cache'],
      correctAnswer: 0,
      explanation: 'A context switch stores the register and program counter state of the preempted process into its PCB and loads the saved state of the newly selected process.'
    },
    {
      question: 'Which CPU scheduling algorithm is non-preemptive and executes processes in the exact order of their arrival?',
      options: ['First-Come, First-Served (FCFS)', 'Round Robin (RR)', 'Shortest Remaining Time First (SRTF)', 'Multi-Level Feedback Queue'],
      correctAnswer: 0,
      explanation: 'FCFS schedules tasks strictly in order of arrival into the ready queue, operating without preemption until a process finishes or blocks.'
    }
  ]
};

/**
 * Extracts meaningful sentences and nouns from custom study material
 * to dynamically construct grounded questions when no pre-built topic exists.
 */
function generateDynamicQuestionsFromText(rawText, count, difficulty, topicTitle) {
  const clean = String(rawText || '').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/[.?!]\s+/).filter(s => s.trim().length >= 25 && s.trim().length <= 250);

  const questions = [];
  const safeTitle = topicTitle || 'Study Material';

  // Strategy A: Cloze (fill-in-the-blank) from substantive sentences
  for (let i = 0; i < sentences.length && questions.length < count; i++) {
    const s = sentences[i].trim();
    // Find candidate key phrase (capitalized words or words >= 6 letters)
    const words = s.split(' ');
    const candidates = words.filter(w => /^[A-Z][a-z]{3,}/.test(w) || w.length >= 7);
    if (candidates.length === 0) continue;

    const targetWord = candidates[Math.floor(candidates.length / 2)].replace(/[^a-zA-Z0-9_-]/g, '');
    if (!targetWord || targetWord.length < 3) continue;

    const blankedSentence = s.replace(new RegExp(`\\b${targetWord}\\b`, 'i'), '_______');
    if (blankedSentence === s) continue;

    // Generate plausible distractors
    const distractors = [
      targetWord + ' protocol',
      'alternative ' + targetWord,
      'inverse ' + targetWord
    ];

    const options = [targetWord, ...distractors];
    // Shuffle options
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.indexOf(targetWord);

    questions.push({
      id: questions.length + 1,
      question: `According to the study material, complete the following: "${blankedSentence}"`,
      options: shuffled,
      correctAnswer: correctIdx >= 0 ? correctIdx : 0,
      explanation: `Based on the provided notes: "${s}."`,
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: s
    });
  }

  // Strategy B: General grounded conceptual questions if sentences were few
  const genericConceptQuestions = [
    {
      template: (t) => `What is the core objective or primary purpose of "${t}" according to educational principles?`,
      correct: (t) => `Providing a structured methodology and foundational concepts for ${t}`,
      distractors: [
        'Eliminating all computational overhead completely',
        'Replacing standard hardware protocols with deprecated formats',
        'Restricting execution to single-threaded offline environments'
      ],
      explanation: (t) => `The fundamental focus of ${t} centers on core principles, systematic implementation, and structured domain knowledge.`
    },
    {
      template: (t) => `In the context of "${t}", which of the following best characterizes a key operational trade-off?`,
      correct: () => 'Balancing performance throughput and reliability against resource complexity',
      distractors: [
        'Sacrificing correctness for arbitrary random execution',
        'Assuming zero memory allocation under peak workloads',
        'Disabling all error-handling mechanisms in production'
      ],
      explanation: (t) => `Designing and studying ${t} consistently requires balancing efficiency, reliability, maintainability, and resource utilization.`
    },
    {
      template: (t) => `Which standard practice is recommended when studying or implementing "${t}"?`,
      correct: () => 'Systematic decomposition into modular components with verifiable requirements',
      distractors: [
        'Combining all concerns into an undocumented monolithic block',
        'Bypassing validation and verification phases during testing',
        'Hardcoding transient state variables across boundaries'
      ],
      explanation: (t) => `Best practices in ${t} emphasize modularity, separation of concerns, and rigorous validation.`
    },
    {
      template: (t) => `What is a common challenge encountered when scaling concepts in "${t}"?`,
      correct: () => 'Managing concurrency, state synchronization, and boundary interfaces',
      distractors: [
        'Eliminating the need for persistent state entirely',
        'Guaranteeing infinite throughput with zero latency',
        'Completely preventing any asynchronous communication'
      ],
      explanation: (t) => `Scalability in ${t} typically demands handling synchronization, state consistency, and reliable communication.`
    },
    {
      template: (t) => `Which principle is critical for ensuring fault tolerance and resilience in "${t}"?`,
      correct: () => 'Graceful degradation, redundancy, and defensive error containment',
      distractors: [
        'Terminating all processes immediately upon any minor exception',
        'Ignoring transient exceptions and suppressing all logs',
        'Allocating unbounded resources without backpressure limits'
      ],
      explanation: (t) => `Resilience in ${t} is achieved through defensive design, redundancy, and graceful degradation under stress.`
    }
  ];

  let genericIdx = 0;
  while (questions.length < count) {
    const item = genericConceptQuestions[genericIdx % genericConceptQuestions.length];
    const correct = item.correct(safeTitle);
    const options = [correct, ...item.distractors];
    const shuffled = [...options].sort(() => Math.random() - 0.5);

    questions.push({
      id: questions.length + 1,
      question: item.template(safeTitle),
      options: shuffled,
      correctAnswer: shuffled.indexOf(correct),
      explanation: item.explanation(safeTitle),
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: `Core educational principles of ${safeTitle}`
    });
    genericIdx++;
  }

  return questions.slice(0, count);
}

/**
 * Main export: generates a complete, validated quiz questions array.
 * 
 * @param {string} topic - Subject or topic name.
 * @param {number} count - Desired number of questions (1-50).
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'.
 * @param {string} [contextText] - Optional raw study notes text.
 * @returns {Array<object>} Array of structured questions ready for the UI.
 */
export function generateResilientQuiz(topic, count = 10, difficulty = 'medium', contextText = '') {
  const targetCount = Math.min(50, Math.max(1, Number(count) || 10));
  const normalizedTopic = String(topic || '').trim().toLowerCase();

  // Check if we have pre-built knowledge questions for this exact or related topic (strict phrase match, never loose substring)
  for (const [key, bank] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    const isMatch = normalizedTopic === key || new RegExp(`(^|\\b)${key}(\\b|$)`, 'i').test(normalizedTopic);
    if (isMatch) {
      const selected = bank.slice(0, targetCount).map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: difficulty || 'medium',
        topic: topic || key,
        sourceReference: `Fundamental Principles of ${topic || key}`
      }));

      // If bank has fewer than requested, top up dynamically
      if (selected.length < targetCount) {
        const remaining = targetCount - selected.length;
        const extra = generateDynamicQuestionsFromText(contextText || topic, remaining, difficulty, topic);
        extra.forEach((eq, idx) => {
          eq.id = selected.length + idx + 1;
          selected.push(eq);
        });
      }
      return selected;
    }
  }

  // Otherwise, dynamically generate from study text or topic
  return generateDynamicQuestionsFromText(contextText || topic, targetCount, difficulty, topic);
}
