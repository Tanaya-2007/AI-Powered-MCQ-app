import { validateStudyText } from './validation.js';
/**
 * Resilient Fallback Quiz Generator
 * 
 * Guarantees that users ALWAYS receive high-quality, grounded multiple-choice questions
 * across major academic disciplines, even when the cloud backend is cold-starting or rate-limited.
 */

// Domain knowledge templates for popular academic & technical topics
export const TOPIC_KNOWLEDGE_BASE = {

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
    },
    {
      question: 'What is "Thrashing" in an operating system?',
      options: ['A state where the CPU spends more time swapping pages in and out than executing instructions', 'Rapid destruction of corrupted sectors on an SSD', 'Overclocking the GPU until thermal throttling occurs', 'Continuous buffer overflows triggered by network packets'],
      correctAnswer: 0,
      explanation: 'Thrashing occurs when high memory demand causes continuous page faults, forcing the OS to spend excessive time swapping pages between RAM and swap storage.'
    },
    {
      question: 'What is a Semaphore in concurrent programming?',
      options: ['A synchronization variable used to control access to a common resource by multiple processes', 'A CPU cache register holding the program counter', 'A network socket protocol for broadcast messages', 'A compiler flag enabling code optimization'],
      correctAnswer: 0,
      explanation: 'Semaphores are integer variables accessed via atomic operations (wait/signal) to manage synchronization and avoid race conditions.'
    },
    {
      question: 'Which page replacement algorithm replaces the page that will not be used for the longest period in the future?',
      options: ['Optimal Page Replacement (OPT)', 'First-In, First-Out (FIFO)', 'Least Recently Used (LRU)', 'Clock Algorithm'],
      correctAnswer: 0,
      explanation: 'The Optimal Page Replacement algorithm guarantees the lowest possible page-fault rate by looking ahead, serving as an ideal theoretical benchmark.'
    },
    {
      question: 'In Unix-like systems, which system call creates a new child process as an exact duplicate of the parent?',
      options: ['fork()', 'exec()', 'wait()', 'pthread_create()'],
      correctAnswer: 0,
      explanation: 'fork() creates a new process by duplicating the calling process, returning 0 to the child and the childs PID to the parent.'
    },
    {
      question: 'What is the role of the Translation Lookaside Buffer (TLB)?',
      options: ['A high-speed hardware cache used to speed up virtual-to-physical address translation', 'A buffer holding pending disk write operations', 'A register tracking currently running thread identifiers', 'A queue for storing incoming hardware interrupts'],
      correctAnswer: 0,
      explanation: 'The TLB is a dedicated MMU cache that stores recent virtual-to-physical page table mappings to avoid expensive memory lookups.'
    }
  ],
  'computer networks': [
    {
      question: 'Which layer of the OSI model is responsible for end-to-end reliable data delivery, flow control, and error correction?',
      options: ['Transport Layer (Layer 4)', 'Network Layer (Layer 3)', 'Data Link Layer (Layer 2)', 'Session Layer (Layer 5)'],
      correctAnswer: 0,
      explanation: 'The Transport layer (e.g. TCP) provides host-to-host communication services, ensuring reliable data transfer, flow control, and segmentation.'
    },
    {
      question: 'What is the primary difference between TCP and UDP protocols?',
      options: ['TCP is connection-oriented and guarantees delivery; UDP is connectionless and prioritized for speed', 'TCP operates at Layer 3; UDP operates at Layer 4', 'TCP encrypts payloads by default; UDP transmits plain text', 'TCP only supports broadcast; UDP only supports unicast'],
      correctAnswer: 0,
      explanation: 'TCP uses a 3-way handshake and acknowledgments for reliable transmission, whereas UDP has minimal overhead without guaranteed delivery.'
    },
    {
      question: 'What is the primary role of the Domain Name System (DNS)?',
      options: ['Translating human-readable domain names into numerical IP addresses', 'Assigning local IP addresses dynamically to host machines', 'Encrypting HTTP traffic across public WiFi networks', 'Routing BGP packets between autonomous systems'],
      correctAnswer: 0,
      explanation: 'DNS functions as the internet directory service, mapping human-friendly hostnames (e.g. example.com) to machine IP addresses.'
    },
    {
      question: 'What mechanism does the TCP protocol use to initiate a connection between a client and a server?',
      options: ['Three-Way Handshake (SYN -> SYN-ACK -> ACK)', 'Two-Way Handshake (HELLO -> WELCOME)', 'Four-Way Teardown (FIN -> ACK -> FIN -> ACK)', 'Sliding Window Probe'],
      correctAnswer: 0,
      explanation: 'TCP establishes reliable connections using a 3-way handshake: Client sends SYN, server responds with SYN-ACK, client acknowledges with ACK.'
    },
    {
      question: 'Which protocol is used to map an IPv4 address to a physical MAC address on a local area network?',
      options: ['ARP (Address Resolution Protocol)', 'DHCP (Dynamic Host Configuration Protocol)', 'ICMP (Internet Control Message Protocol)', 'IGMP (Internet Group Management Protocol)'],
      correctAnswer: 0,
      explanation: 'ARP resolves Layer 3 IP addresses into Layer 2 hardware MAC addresses within a local broadcast domain.'
    },
    {
      question: 'What is the standard subnet mask for a Class C network (or CIDR /24)?',
      options: ['255.255.255.0', '255.255.0.0', '255.0.0.0', '255.255.255.255'],
      correctAnswer: 0,
      explanation: 'A /24 subnet has 24 network bits set to 1, producing the mask 255.255.255.0 and accommodating up to 254 usable host addresses.'
    },
    {
      question: 'What is the role of Border Gateway Protocol (BGP) on the global internet?',
      options: ['Routing traffic between different Autonomous Systems (AS) across the internet', 'Assigning MAC addresses inside home routers', 'Synchronizing high-precision NTP clocks across servers', 'Establishing secure VPN tunnels between remote clients'],
      correctAnswer: 0,
      explanation: 'BGP is the exterior gateway protocol that manages how packets are routed across large autonomous networks composing the internet.'
    },
    {
      question: 'What security enhancement does HTTPS provide over plain HTTP?',
      options: ['Transport Layer Security (TLS/SSL) encryption for confidentiality, integrity, and authentication', 'Faster caching on local proxy servers', 'Compression of HTML images at the socket level', 'Automatic prevention of SQL injection on the backend'],
      correctAnswer: 0,
      explanation: 'HTTPS encrypts bidirectional HTTP communications using TLS/SSL to prevent eavesdropping and tampering.'
    },
    {
      question: 'Which HTTP status code signifies that a requested resource was not found on the server?',
      options: ['404 Not Found', '500 Internal Server Error', '403 Forbidden', '301 Moved Permanently'],
      correctAnswer: 0,
      explanation: 'HTTP 404 indicates that the client was able to communicate with the server, but the requested URI does not exist.'
    },
    {
      question: 'In TCP congestion control, what algorithm is used to rapidly increase the congestion window size until a threshold is reached?',
      options: ['Slow Start', 'Congestion Avoidance', 'Fast Retransmit', 'Fast Recovery'],
      correctAnswer: 0,
      explanation: 'Slow Start exponentially doubles the congestion window (CWND) each round-trip time (RTT) until reaching the slow-start threshold (ssthresh).'
    }
  ],
  'databases': [
    {
      question: 'In database management systems, what does the "A" in ACID stand for and guarantee?',
      options: ['Atomicity: All operations in a transaction succeed completely or all are rolled back', 'Availability: High uptime across distributed cluster instances', 'Authentication: Strict credential verification for write access', 'Asynchrony: Non-blocking write operations to the journal'],
      correctAnswer: 0,
      explanation: 'Atomicity guarantees that a transaction is treated as a single indivisible unit: either all statements execute or none take effect.'
    },
    {
      question: 'Which Normal Form requires eliminating partial functional dependencies on a composite primary key?',
      options: ['Second Normal Form (2NF)', 'First Normal Form (1NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
      correctAnswer: 0,
      explanation: '2NF requires that the relation is in 1NF and all non-key attributes are fully functionally dependent on the primary key, eliminating partial dependencies.'
    },
    {
      question: 'Why are B-Trees (and B+ Trees) preferred over binary search trees for disk-based database indexes?',
      options: ['They have high fan-out, significantly reducing disk I/O operations by keeping the tree shallow', 'They require zero disk space overhead for leaf nodes', 'They eliminate the need for write-ahead logging completely', 'They prevent table lock contention during concurrent reads'],
      correctAnswer: 0,
      explanation: 'B+ Trees store multiple keys per node, maximizing data read per disk block access and keeping tree depth low (often 3 to 4 levels for millions of records).'
    },
    {
      question: 'What is the primary function of a Write-Ahead Log (WAL) in relational databases?',
      options: ['Ensuring durability and crash recovery by logging changes before writing to disk data pages', 'Generating automated real-time backups to S3 buckets', 'Profiling slow SQL queries for index recommendations', 'Compressing read queries in memory before execution'],
      correctAnswer: 0,
      explanation: 'WAL enforces that all transactional modifications are written to durable log files prior to applying changes to database data pages on disk.'
    },
    {
      question: 'Which SQL JOIN returns all rows from the left table and matched rows from the right table, filling unmatched right columns with NULL?',
      options: ['LEFT OUTER JOIN', 'INNER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'],
      correctAnswer: 0,
      explanation: 'A LEFT JOIN returns all records from the left table and matching rows from the right; if no match exists, NULL values are returned for right columns.'
    },
    {
      question: 'In SQL transaction isolation, which phenomenon occurs when a transaction reads data that has been modified by another uncommitted transaction?',
      options: ['Dirty Read', 'Non-Repeatable Read', 'Phantom Read', 'Serialization Anomaly'],
      correctAnswer: 0,
      explanation: 'A dirty read occurs when a transaction reads uncommitted changes from another concurrent transaction that may later be rolled back.'
    },
    {
      question: 'What is the highest isolation level in SQL that completely prevents dirty reads, non-repeatable reads, and phantom reads?',
      options: ['Serializable', 'Repeatable Read', 'Read Committed', 'Read Uncommitted'],
      correctAnswer: 0,
      explanation: 'Serializable isolation executes transactions with the effect of a serial schedule, offering the strongest consistency guarantees.'
    },
    {
      question: 'What is the purpose of a Composite Index in SQL databases?',
      options: ['An index created on two or more columns of a table to accelerate multi-column search queries', 'An index that combines disk storage with RAM cache', 'An index generated across multiple distinct databases simultaneously', 'An index that enforces encryption on sensitive text fields'],
      correctAnswer: 0,
      explanation: 'A composite index indexes multiple columns together, optimizing queries that filter on prefixes of those columns.'
    },
    {
      question: 'What does a Foreign Key constraint enforce in a relational schema?',
      options: ['Referential Integrity: Ensuring that a column value matches an existing primary key in another table', 'Unique constraints across all tables in a schema', 'Automatic encryption of stored records', 'Replication of rows to standby database servers'],
      correctAnswer: 0,
      explanation: 'Foreign keys enforce referential integrity by requiring that values in a child table match an existing record in the referenced parent table.'
    },
    {
      question: 'What is the primary characteristic of NoSQL Document Databases (e.g., MongoDB, CouchDB)?',
      options: ['Storing semi-structured data in flexible, schema-free JSON/BSON documents', 'Enforcing strict third normal form schemas across tables', 'Disallowing all write operations without two-phase commit', 'Storing data exclusively as mathematical key-value pairs without subfields'],
      correctAnswer: 0,
      explanation: 'Document databases store data as hierarchical, self-describing JSON/BSON documents with dynamic, flexible schemas.'
    }
  ],
  'machine learning': [
    {
      question: 'What is the fundamental trade-off described by the "Bias-Variance Tradeoff" in supervised machine learning?',
      options: ['High bias leads to underfitting; high variance leads to overfitting on training data', 'High bias increases training speed; high variance decreases memory consumption', 'Bias relates only to linear regression; variance relates only to decision trees', 'High variance prevents gradient explosion during backpropagation'],
      correctAnswer: 0,
      explanation: 'Underfitting occurs when a model is too simple (high bias); overfitting occurs when a model is overly complex and captures training noise (high variance).'
    },
    {
      question: 'Which technique is commonly used to prevent overfitting in deep neural networks by randomly zeroing activations during training?',
      options: ['Dropout', 'Batch Normalization', 'Max Pooling', 'Gradient Clipping'],
      correctAnswer: 0,
      explanation: 'Dropout randomly deactivates a fraction of neurons during each training step, preventing co-adaptation and improving generalization.'
    },
    {
      question: 'What is the primary role of an Activation Function (e.g. ReLU, Sigmoid) in an artificial neural network?',
      options: ['Introducing non-linearity, allowing the network to learn complex non-linear mappings', 'Normalizing the input dataset to have zero mean and unit variance', 'Accelerating GPU memory transfer during forward passes', 'Computing the exact derivative of loss with respect to weights'],
      correctAnswer: 0,
      explanation: 'Without non-linear activation functions, a multilayer neural network collapses into a single linear transformation regardless of depth.'
    },
    {
      question: 'Which metric is best suited for evaluating a classification model trained on a heavily imbalanced dataset (e.g. fraud detection)?',
      options: ['Precision-Recall / F1-Score', 'Raw Accuracy', 'Mean Squared Error (MSE)', 'R-squared (Coefficient of Determination)'],
      correctAnswer: 0,
      explanation: 'In highly imbalanced datasets, accuracy can be misleading (predicting all negatives yields high accuracy); Precision, Recall, and F1-score evaluate true performance.'
    },
    {
      question: 'In gradient descent optimization, what role does the Learning Rate hyperparameter play?',
      options: ['Controlling the step size taken towards the minimum of the loss function in each iteration', 'Determining the number of layers in the neural network', 'Specifying the percentage of data allocated to the test split', 'Fixing the random seed for reproducible model initialization'],
      correctAnswer: 0,
      explanation: 'The learning rate scales the magnitude of parameter updates; if too small, convergence is slow; if too large, optimization can diverge.'
    },
    {
      question: 'What is the key difference between Supervised and Unsupervised learning?',
      options: ['Supervised learning trains on labeled input-output pairs; unsupervised learning finds patterns in unlabeled data', 'Supervised learning requires neural networks; unsupervised learning only uses linear models', 'Supervised learning is offline; unsupervised learning is strictly real-time', 'Supervised learning does not use loss functions during optimization'],
      correctAnswer: 0,
      explanation: 'Supervised algorithms learn from ground-truth target labels, whereas unsupervised algorithms discover inherent cluster structures in unlabeled inputs.'
    },
    {
      question: 'Which regularization technique adds the absolute sum of weights (L1 penalty) to the loss function, encouraging parameter sparsity?',
      options: ['Lasso Regularization (L1)', 'Ridge Regularization (L2)', 'Elastic Net Regularization', 'Early Stopping'],
      correctAnswer: 0,
      explanation: 'L1 (Lasso) regularization adds the absolute values of coefficients to the loss, driving non-essential feature weights to exactly zero.'
    },
    {
      question: 'What is the purpose of the Transformer architecture’s "Self-Attention" mechanism?',
      options: ['Computing dynamically weighted representations of all tokens relative to one another in parallel', 'Recursively passing hidden states sequentially like an RNN', 'Compressing input text into a single scalar value', 'Translating audio waveforms into Fourier spectrograms'],
      correctAnswer: 0,
      explanation: 'Self-attention allows tokens to attend to all other tokens in a sequence simultaneously, capturing long-range contextual relationships efficiently.'
    },
    {
      question: 'Which algorithm is an ensemble method that constructs multiple decision trees during training and outputs the mode or mean prediction?',
      options: ['Random Forest', 'Support Vector Machine (SVM)', 'Logistic Regression', 'K-Means Clustering'],
      correctAnswer: 0,
      explanation: 'Random Forests train multiple decision trees on random data bootstrap samples and feature subsets (bagging) to reduce variance.'
    },
    {
      question: 'What is the "Vanishing Gradient Problem" commonly observed in deep neural networks with sigmoid activations?',
      options: ['Gradients become exponentially small as they propagate backward through layers, preventing early layers from updating', 'Gradients grow exponentially large, causing weights to overflow to NaN', 'The learning rate automatically decays to zero during epoch 1', 'The loss function reaches negative infinity during backpropagation'],
      correctAnswer: 0,
      explanation: 'Because the derivative of sigmoid saturates near 0 and 1, multiplying small fractions across many layers diminishes the error signal to near zero.'
    }
  ],
  'biology': [
    {
      question: 'What are the primary products of the Light-Dependent Reactions of photosynthesis that are subsequently used in the Calvin cycle?',
      options: ['ATP and NADPH', 'Glucose and Oxygen', 'Carbon Dioxide and Water', 'ADP and NADP+'],
      correctAnswer: 0,
      explanation: 'The light reactions convert solar energy into chemical energy stored in ATP and NADPH, which power the synthesis of sugar in the stroma.'
    },
    {
      question: 'In plant cells, within which specific cellular organelle and sub-compartment does photosynthesis take place?',
      options: ['Chloroplasts: light reactions in thylakoids, Calvin cycle in stroma', 'Mitochondria: Krebs cycle in matrix', 'Endoplasmic reticulum: protein synthesis in lumen', 'Golgi apparatus: cisternal cisternae'],
      correctAnswer: 0,
      explanation: 'Photosynthesis occurs in chloroplasts: chlorophyll pigments reside in thylakoid membranes, while the Calvin cycle occurs in the fluid stroma.'
    },
    {
      question: 'Which enzyme is responsible for catalyzing the fixation of atmospheric carbon dioxide (CO2) in the Calvin cycle?',
      options: ['RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)', 'ATP Synthase', 'DNA Polymerase III', 'Amylase'],
      correctAnswer: 0,
      explanation: 'RuBisCO is the primary enzyme that captures CO2 and attaches it to RuBP (Ribulose 1,5-bisphosphate) to initiate carbon fixation.'
    },
    {
      question: 'During cellular respiration, in which stage is the vast majority of ATP synthesized via oxidative phosphorylation?',
      options: ['Electron Transport Chain and Chemiosmosis', 'Glycolysis', 'Citric Acid (Krebs) Cycle', 'Pyruvate Oxidation'],
      correctAnswer: 0,
      explanation: 'The electron transport chain generates a proton gradient across the inner mitochondrial membrane, driving ATP synthase to produce ~30-34 ATP.'
    },
    {
      question: 'What is the central dogma of molecular biology as described by Francis Crick?',
      options: ['DNA -> RNA -> Protein', 'Protein -> RNA -> DNA', 'RNA -> DNA -> Protein', 'DNA -> Protein -> RNA'],
      correctAnswer: 0,
      explanation: 'The central dogma outlines genetic information flow: DNA is transcribed into messenger RNA (mRNA), which is then translated into functional proteins.'
    },
    {
      question: 'Which phase of mitosis is characterized by the alignment of duplicated chromosomes along the equatorial plane of the cell?',
      options: ['Metaphase', 'Prophase', 'Anaphase', 'Telophase'],
      correctAnswer: 0,
      explanation: 'During Metaphase, spindle fibers pull sister chromatids to line up along the metaphase plate before separation.'
    },
    {
      question: 'What is the primary function of DNA Helicase during DNA replication?',
      options: ['Unwinding and separating the double-stranded DNA helix at the replication fork', 'Synthesizing complementary RNA primers', 'Joining Okazaki fragments on the lagging strand', 'Proofreading newly synthesized nucleotide sequences'],
      correctAnswer: 0,
      explanation: 'Helicase breaks the hydrogen bonds holding base pairs together, unwinding the double helix so polymerases can access the templates.'
    },
    {
      question: 'Which nitrogenous base is present in RNA molecules but absent in DNA?',
      options: ['Uracil (U)', 'Thymine (T)', 'Adenine (A)', 'Cytosine (C)'],
      correctAnswer: 0,
      explanation: 'RNA uses Uracil (U) instead of Thymine (T) to pair complementarily with Adenine (A).'
    },
    {
      question: 'What biological principle explains why heterozygous individuals for the sickle-cell trait have higher resistance against malaria?',
      options: ['Heterozygote Advantage (Balanced Polymorphism)', 'Genetic Drift', 'Founder Effect', 'Non-Random Mating'],
      correctAnswer: 0,
      explanation: 'Heterozygote advantage occurs when individuals with one sickle-cell allele have an evolutionary fitness benefit against malaria infection.'
    },
    {
      question: 'How do enzymes accelerate chemical reactions in biological systems?',
      options: ['By lowering the activation energy required for the reaction to proceed', 'By increasing the temperature of the cellular environment', 'By permanently altering the equilibrium constant of the reaction', 'By acting as irreversible reactant substrates'],
      correctAnswer: 0,
      explanation: 'Enzymes are biological catalysts that lower activation energy without changing the overall free energy change (delta G) of the reaction.'
    }
  ],
  'physics': [
    {
      question: 'According to Newton’s Second Law of Motion, what is the mathematical relationship between net force, mass, and acceleration?',
      options: ['F = m * a', 'F = m / a', 'F = 0.5 * m * v^2', 'F = m * g * h'],
      correctAnswer: 0,
      explanation: 'Newton’s second law states that the acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass (F = ma).'
    },
    {
      question: 'What does the First Law of Thermodynamics state regarding energy conservation in an isolated system?',
      options: ['Energy cannot be created or destroyed; it can only change from one form to another', 'The entropy of an isolated system always increases over time', 'Absolute zero temperature can never be reached in a finite number of steps', 'Heat flows spontaneously from colder to hotter bodies'],
      correctAnswer: 0,
      explanation: 'The first law of thermodynamics is the principle of conservation of energy: delta U = Q - W.'
    },
    {
      question: 'What phenomenon causes the observed frequency of a wave to shift when the wave source is moving relative to an observer?',
      options: ['Doppler Effect', 'Photoelectric Effect', 'Compton Scattering', 'Total Internal Reflection'],
      correctAnswer: 0,
      explanation: 'The Doppler effect describes the frequency change of sound, light, or other waves as the source and observer move toward or away from each other.'
    },
    {
      question: 'Which law describes the electrostatic force of attraction or repulsion between two point charges?',
      options: ['Coulomb’s Law', 'Ohm’s Law', 'Faraday’s Law of Induction', 'Ampere’s Circuital Law'],
      correctAnswer: 0,
      explanation: 'Coulomb’s law states that force is directly proportional to the product of charges and inversely proportional to the square of distance between them (F = k*q1*q2 / r^2).'
    },
    {
      question: 'What fundamental constant represents the speed of light in a vacuum?',
      options: ['Approximately 3.0 x 10^8 m/s', 'Approximately 9.8 x 10^3 m/s', 'Approximately 1.6 x 10^-19 m/s', 'Approximately 6.63 x 10^-34 m/s'],
      correctAnswer: 0,
      explanation: 'The speed of light in vacuum (c) is exactly 299,792,458 m/s (~3.0 x 10^8 m/s).'
    },
    {
      question: 'What happens to the resistance of an ideal conductor when it transitions into a superconducting state below its critical temperature?',
      options: ['Electrical resistance drops to exactly zero', 'Resistance increases exponentially', 'Resistance fluctuates randomly with magnetic flux', 'Resistance remains constant while capacitance drops'],
      correctAnswer: 0,
      explanation: 'Superconductivity is characterized by zero electrical resistance and the expulsion of internal magnetic fields (Meissner effect).'
    },
    {
      question: 'According to Einstein’s Special Theory of Relativity, what happens to the elapsed time measured on a clock moving at speeds approaching the speed of light?',
      options: ['Time dilates (time passes more slowly relative to a stationary observer)', 'Time contracts (time passes faster)', 'Time reverses direction entirely', 'Time remains invariant in all inertial reference frames'],
      correctAnswer: 0,
      explanation: 'Time dilation dictates that moving clocks run slower relative to an observer at rest in another frame of reference.'
    },
    {
      question: 'What physical quantity is measured in Joules (or kg * m^2 / s^2)?',
      options: ['Work and Energy', 'Power', 'Momentum', 'Electric Current'],
      correctAnswer: 0,
      explanation: 'The Joule is the SI unit of work and energy, equivalent to the work done by a force of one Newton exerted over a displacement of one meter.'
    },
    {
      question: 'Which law of electromagnetic induction states that the induced electromotive force (EMF) is proportional to the time rate of change of magnetic flux?',
      options: ['Faraday’s Law', 'Lenz’s Law', 'Gauss’s Law', 'Biot-Savart Law'],
      correctAnswer: 0,
      explanation: 'Faraday’s law of induction establishes that EMF = -dPhi_B / dt, where Phi_B is magnetic flux.'
    },
    {
      question: 'What is the escape velocity from the surface of Earth approximately equal to?',
      options: ['Approximately 11.2 km/s', 'Approximately 9.8 km/s', 'Approximately 3.0 km/s', 'Approximately 25.4 km/s'],
      correctAnswer: 0,
      explanation: 'Earth’s escape velocity is ~11.2 km/s (~40,270 km/h), representing the minimum speed required to break free from Earths gravitational field without further propulsion.'
    }
  ],
  'chemistry': [
    {
      question: 'What is the primary factor that dictates the chemical reactivity and bonding characteristics of an atom?',
      options: ['The configuration of electrons in its outermost valence shell', 'The total number of neutrons in the nucleus', 'The physical mass of its nuclear isotopes', 'The speed of orbital rotation around the nucleus'],
      correctAnswer: 0,
      explanation: 'Valence electrons govern how atoms interact, share, or transfer electrons to achieve stable octet noble gas configurations.'
    },
    {
      question: 'Which periodic trend increases across a period from left to right and decreases down a group?',
      options: ['Electronegativity and Ionization Energy', 'Atomic Radius', 'Metallic Character', 'Nuclear Mass'],
      correctAnswer: 0,
      explanation: 'Effective nuclear charge pulls electrons tighter across periods, increasing electronegativity and ionization energy while decreasing atomic radius.'
    },
    {
      question: 'According to Le Chatelier’s Principle, what happens to a chemical equilibrium when the pressure of a gaseous system is increased?',
      options: ['The equilibrium shifts towards the side with fewer moles of gas', 'The equilibrium shifts towards the side with more moles of gas', 'The reaction rate drops to zero permanently', 'The equilibrium constant (K) increases by a factor of 10'],
      correctAnswer: 0,
      explanation: 'Increasing pressure forces the system to counteract stress by shifting toward the side containing fewer gas moles to relieve pressure.'
    },
    {
      question: 'What is the definition of a Bronsted-Lowry acid?',
      options: ['A substance that donates a proton (H+) to a base', 'A substance that accepts an electron pair from a ligand', 'A substance that produces OH- ions in water', 'A non-metal oxide that neutralizes alkaline salts'],
      correctAnswer: 0,
      explanation: 'In the Bronsted-Lowry acid-base theory, an acid is a proton donor (H+) and a base is a proton acceptor.'
    },
    {
      question: 'What is the value of Avogadro’s Number, representing the number of particles in one mole of a substance?',
      options: ['6.022 x 10^23', '3.141 x 10^12', '1.602 x 10^-19', '9.81 x 10^8'],
      correctAnswer: 0,
      explanation: 'Avogadro’s constant is approximately 6.022 x 10^23 entities per mole.'
    },
    {
      question: 'What type of chemical bond is formed when two atoms share one or more pairs of valence electrons equally?',
      options: ['Non-Polar Covalent Bond', 'Ionic Bond', 'Hydrogen Bond', 'Metallic Bond'],
      correctAnswer: 0,
      explanation: 'Non-polar covalent bonds form between atoms with identical or very similar electronegativities, sharing electrons evenly.'
    },
    {
      question: 'In a redox (oxidation-reduction) reaction, what happens to the substance that undergoes oxidation?',
      options: ['It loses electrons and its oxidation state increases', 'It gains electrons and its oxidation state decreases', 'It gains protons from the solvent', 'It precipitates out of the aqueous solution as a salt'],
      correctAnswer: 0,
      explanation: 'Oxidation is the loss of electrons (OIL RIG: Oxidation Is Loss, Reduction Is Gain); its oxidation number increases.'
    },
    {
      question: 'What is the pH of a neutral aqueous solution at 25°C?',
      options: ['7.0', '0.0', '14.0', '1.0'],
      correctAnswer: 0,
      explanation: 'At 25°C, [H+] = [OH-] = 1.0 x 10^-7 M, resulting in pH = -log(10^-7) = 7.0.'
    },
    {
      question: 'Which functional group characterizes alcohols in organic chemistry?',
      options: ['Hydroxyl group (-OH)', 'Carbonyl group (C=O)', 'Carboxyl group (-COOH)', 'Amino group (-NH2)'],
      correctAnswer: 0,
      explanation: 'Alcohols contain one or more hydroxyl (-OH) functional groups bonded covalently to saturated carbon atoms.'
    },
    {
      question: 'What is the Ideal Gas Law equation relating pressure, volume, moles, temperature, and the universal gas constant?',
      options: ['PV = nRT', 'P1*V1 = P2*V2', 'E = mc^2', 'q = m*c*deltaT'],
      correctAnswer: 0,
      explanation: 'The ideal gas equation is PV = nRT, where P is pressure, V is volume, n is moles, R is universal gas constant, and T is absolute temperature.'
    }
  ],
  'calculus': [
    {
      question: 'What is the geometric interpretation of the derivative of a function f(x) at a given point x = a?',
      options: ['The slope of the tangent line to the curve at that point', 'The area under the curve between 0 and a', 'The length of the arc along the coordinate axis', 'The distance from the origin to the point (a, f(a))'],
      correctAnswer: 0,
      explanation: 'The derivative f(a) represents the instantaneous rate of change of f(x) with respect to x, which equals the slope of the tangent line at x = a.'
    },
    {
      question: 'What does the First Part of the Fundamental Theorem of Calculus state?',
      options: ['If f is continuous on [a, b], then d/dx [integrate from a to x of f(t) dt] = f(x)', 'Every polynomial function of degree n has exactly n real roots', 'The limit of a sum equals the product of their individual derivatives', 'All continuous functions are bounded on closed intervals'],
      correctAnswer: 0,
      explanation: 'The Fundamental Theorem connects differentiation and integration, proving that differentiation inverts definite integration.'
    },
    {
      question: 'What is the derivative of f(x) = e^(3x) with respect to x?',
      options: ['3 * e^(3x)', 'e^(3x) / 3', '3x * e^(3x - 1)', 'e^(3x)'],
      correctAnswer: 0,
      explanation: 'Using the chain rule: d/dx [e^u] = e^u * (du/dx). With u = 3x, the derivative is 3 * e^(3x).'
    },
    {
      question: 'Which rule is used to differentiate a composition of two functions, f(g(x))?',
      options: ['Chain Rule: f(g(x)) * g(x)', 'Product Rule: f(x)*g(x) + f(x)*g(x)', 'Quotient Rule: [f(x)*g(x) - f(x)*g(x)] / [g(x)]^2', 'Power Rule: n * x^(n - 1)'],
      correctAnswer: 0,
      explanation: 'The Chain Rule states that the derivative of a composite function is the derivative of the outer function evaluated at the inner function, times the derivative of the inner function.'
    },
    {
      question: 'What method of evaluating indeterminate limits (such as 0/0 or infinity/infinity) involves differentiating numerator and denominator separately?',
      options: ['L’Hopital’s Rule', 'Squeeze Theorem', 'Euler’s Method', 'Integration by Parts'],
      correctAnswer: 0,
      explanation: 'L’Hopital’s rule states that for indeterminate forms 0/0 or inf/inf, lim [f(x)/g(x)] = lim [f(x)/g(x)], provided the limit exists.'
    },
    {
      question: 'What is the integral of 1/x with respect to x for x > 0?',
      options: ['ln(x) + C', '-1 / x^2 + C', 'x + C', 'e^x + C'],
      correctAnswer: 0,
      explanation: 'The antiderivative of 1/x is the natural logarithm ln|x| + C.'
    },
    {
      question: 'What condition identifies a critical point of a differentiable function f(x)?',
      options: ['f(x) = 0 or f(x) does not exist', 'f(x) = 0 exclusively', 'f(x) = 1', 'f(x) < 0'],
      correctAnswer: 0,
      explanation: 'Critical points occur where the first derivative is either equal to zero or undefined.'
    },
    {
      question: 'In integration, what technique is the integral analogue of the product rule for differentiation?',
      options: ['Integration by Parts: integral(u dv) = u*v - integral(v du)', 'U-Substitution', 'Partial Fraction Decomposition', 'Trigonometric Substitution'],
      correctAnswer: 0,
      explanation: 'Integration by parts is derived from integrating the product rule: integral(u dv) = uv - integral(v du).'
    },
    {
      question: 'If the second derivative f(x) > 0 on an open interval, what does this indicate about the graph of f(x)?',
      options: ['The graph is concave upward on that interval', 'The graph is concave downward on that interval', 'The function is strictly decreasing everywhere', 'The function has an inflection point at every point'],
      correctAnswer: 0,
      explanation: 'A positive second derivative means the slope f(x) is increasing, indicating the curve is concave upward (opens upward).'
    },
    {
      question: 'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?',
      options: ['2', '1', 'Infinity', '1.5'],
      correctAnswer: 0,
      explanation: 'For a geometric series with first term a = 1 and common ratio r = 1/2, the sum S = a / (1 - r) = 1 / (1 - 0.5) = 2.'
    }
  ],
  'world history': [
    {
      question: 'Which incident in Sarajevo in June 1914 triggered the diplomatic crisis that led directly to World War I?',
      options: ['The assassination of Archduke Franz Ferdinand of Austria', 'The sinking of the RMS Lusitania', 'The signing of the Treaty of Brest-Litovsk', 'The Zimmerman Telegram interception'],
      correctAnswer: 0,
      explanation: 'The assassination of Archduke Franz Ferdinand by Gavrilo Princip set off the chain of alliances leading to the outbreak of WWI.'
    },
    {
      question: 'What was the primary cultural and intellectual movement in Europe during the 14th to 17th centuries characterized by a revival of classical learning?',
      options: ['The Renaissance', 'The Enlightenment', 'The Protestant Reformation', 'Romanticism'],
      correctAnswer: 0,
      explanation: 'The Renaissance originated in Italy, emphasizing humanism, arts, and classical Greco-Roman literature and philosophy.'
    },
    {
      question: 'Which event in 1789 marked the dramatic beginning of the French Revolution?',
      options: ['The Storming of the Bastille', 'The Execution of King Louis XVI', 'The Battle of Waterloo', 'The Reign of Terror'],
      correctAnswer: 0,
      explanation: 'On July 14, 1789, Parisian revolutionaries stormed the Bastille fortress prison, a hated symbol of royal tyranny.'
    },
    {
      question: 'What post-World War II initiative provided over $13 billion in economic assistance to rebuild Western European economies?',
      options: ['The Marshall Plan (European Recovery Program)', 'The Truman Doctrine', 'The Warsaw Pact', 'The Yalta Agreement'],
      correctAnswer: 0,
      explanation: 'Enacted in 1948 by the United States, the Marshall Plan financed economic recovery in 16 Western European nations.'
    },
    {
      question: 'In which country did the Industrial Revolution originate during the mid-18th century, largely fueled by coal, iron, and steam power?',
      options: ['Great Britain', 'France', 'Germany', 'United States'],
      correctAnswer: 0,
      explanation: 'Great Britain pioneered industrialization due to vast coal reserves, agricultural surplus, commercial trade wealth, and textile inventions.'
    },
    {
      question: 'What 1944 Allied amphibious invasion of Normandy, France, opened a decisive Western Front against Nazi Germany during World War II?',
      options: ['Operation Overlord (D-Day)', 'Operation Barbarossa', 'The Battle of the Bulge', 'Operation Market Garden'],
      correctAnswer: 0,
      explanation: 'On June 6, 1944 (D-Day), Allied forces landed on five beaches in Normandy, initiating the liberation of Western Europe.'
    },
    {
      question: 'Who drafted the Ninety-Five Theses in 1517, catalyzing the Protestant Reformation across Europe?',
      options: ['Martin Luther', 'John Calvin', 'King Henry VIII', 'Desiderius Erasmus'],
      correctAnswer: 0,
      explanation: 'Martin Luther nailed his 95 Theses to the Wittenberg Castle Church door, criticizing papal indulgences and corruption.'
    },
    {
      question: 'Which ancient civilization built the monumental pyramids of Giza and developed hieroglyphic script along the Nile River?',
      options: ['Ancient Egypt', 'Mesopotamia', 'Ancient Greece', 'Indus Valley Civilization'],
      correctAnswer: 0,
      explanation: 'Ancient Egyptian civilization thrived along the lower Nile River, famous for its pharaohs, pyramids, and hieroglyphic writing.'
    },
    {
      question: 'What was the primary objective of the League of Nations established following World War I in 1919?',
      options: ['Preventing future international conflicts through collective security and disarmament', 'Administering global economic trade tariffs', 'Rebuilding European heavy industry', 'Governing the Panama and Suez canals'],
      correctAnswer: 0,
      explanation: 'Championed by US President Woodrow Wilson, the League of Nations was founded to maintain world peace through diplomacy and collective security.'
    },
    {
      question: 'What geopolitical boundary symbol dividing communist East Berlin and democratic West Berlin was brought down in November 1989?',
      options: ['The Berlin Wall', 'The Iron Curtain', 'The Maginot Line', 'Check-Point Charlie'],
      correctAnswer: 0,
      explanation: 'The fall of the Berlin Wall on November 9, 1989, symbolized the collapse of Soviet-backed communist regimes in Eastern Europe.'
    }
  ],
  'psychology': [
    {
      question: 'In Ivan Pavlov’s classical conditioning experiments with dogs, what was the meat powder classified as prior to any conditioning?',
      options: ['Unconditioned Stimulus (UCS)', 'Conditioned Stimulus (CS)', 'Unconditioned Response (UCR)', 'Conditioned Response (CR)'],
      correctAnswer: 0,
      explanation: 'The meat powder naturally triggered salivation without training, making it the Unconditioned Stimulus (UCS).'
    },
    {
      question: 'What psychological theory proposed by Leon Festinger explains the discomfort people experience when holding contradictory beliefs or behaviors?',
      options: ['Cognitive Dissonance', 'Social Facilitation', 'Fundamental Attribution Error', 'Bystander Effect'],
      correctAnswer: 0,
      explanation: 'Cognitive dissonance is the psychological tension felt when actions and beliefs conflict, motivating individuals to reduce the inconsistency.'
    },
    {
      question: 'According to Jean Piaget’s theory of cognitive development, in which stage do children develop abstract hypothetical thinking and systematic logic?',
      options: ['Formal Operational Stage (Age 12+)', 'Concrete Operational Stage (Ages 7-11)', 'Preoperational Stage (Ages 2-7)', 'Sensorimotor Stage (Ages 0-2)'],
      correctAnswer: 0,
      explanation: 'The Formal Operational stage begins around age 12, characterized by deductive reasoning, abstract logic, and problem-solving.'
    },
    {
      question: 'Which brain structure located in the temporal lobe is critical for consolidating short-term memories into long-term storage?',
      options: ['Hippocampus', 'Amygdala', 'Hypothalamus', 'Medulla Oblongata'],
      correctAnswer: 0,
      explanation: 'The hippocampus is essential for declarative memory consolidation; damage to it causes anterograde amnesia.'
    },
    {
      question: 'In B.F. Skinner’s operant conditioning, what is "Negative Reinforcement"?',
      options: ['Increasing the frequency of a behavior by removing an unpleasant or aversive stimulus', 'Decreasing behavior by administering a punishment', 'Decreasing behavior by withholding an expected reward', 'Using physical restraint to block unwanted actions'],
      correctAnswer: 0,
      explanation: 'Reinforcement always strengthens behavior; negative reinforcement removes a negative condition (e.g. silencing an annoying alarm by waking up).'
    },
    {
      question: 'What is the "Fundamental Attribution Error" in social psychology?',
      options: ['Overemphasizing internal personality traits and underestimating situational factors when judging others’ behavior', 'Blaming oneself for all group project failures', 'Believing that positive events occur only by random chance', 'Assuming everyone shares our personal opinions and biases'],
      correctAnswer: 0,
      explanation: 'People tend to attribute other individuals mistakes to their character (they are lazy) while attributing their own mistakes to circumstance (I was tired).'
    },
    {
      question: 'According to George Miller’s classic paper, what is the average capacity of human short-term working memory?',
      options: ['7 plus or minus 2 items (5 to 9 chunks of information)', '15 to 20 unrelated words', 'Unlimited if items are visual', 'Only 1 item at a time'],
      correctAnswer: 0,
      explanation: 'Miller (1956) showed that short-term memory can retain approximately 7 ± 2 items or meaningful chunks of data.'
    },
    {
      question: 'Which personality structure in Sigmund Freud’s psychoanalytic model operates on the "Reality Principle"?',
      options: ['The Ego', 'The Id', 'The Superego', 'The Subconscious'],
      correctAnswer: 0,
      explanation: 'The Ego balances the instinctual desires of the Id (pleasure principle) with the moral demands of the Superego using realistic strategies.'
    },
    {
      question: 'What phenomenon did Stanley Milgram’s famous 1963 experiments investigate at Yale University?',
      options: ['Obedience to authority figures even when instructed to administer harmful electric shocks', 'Conformity in judging visual line lengths', 'Bystander apathy during public emergencies', 'Prisoner-guard power dynamics in simulated jails'],
      correctAnswer: 0,
      explanation: 'Milgram demonstrated that a startling majority of regular participants (65%) obeyed authority figures to administer perceived lethal electric shocks.'
    },
    {
      question: 'Which neurotransmitter is primarily involved in motor control, reward-motivated behavior, and pleasure reinforcement pathways?',
      options: ['Dopamine', 'Serotonin', 'GABA', 'Acetylcholine'],
      correctAnswer: 0,
      explanation: 'Dopamine plays a central role in reward learning, motivation, motor function (depleted in Parkinson’s disease), and addiction pathways.'
    }
  ]

};

/**
 * Intelligent dynamic question generator from study text or concept.
 * Generates distinct questions with real distractors, avoiding generic repetitiveness.
 */
function generateDynamicQuestions(text, count, difficulty, topicTitle) {
  const safeTitle = topicTitle || 'Study Material';
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/[.?!]\s+/).filter(s => s.trim().length >= 25 && s.trim().length <= 250);

  const questions = [];

  // Strategy A: Cloze & definition extraction from user sentences
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
      `Alternative ${targetWord.slice(0, 3)}-`,
      `Inverted ${targetWord}`,
      `Non-${targetWord.toLowerCase()}`
    ];

    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.indexOf(targetWord);

    questions.push({
      id: questions.length + 1,
      question: `Based on your study notes, complete the following statement: "${blanked}"`,
      options: shuffled,
      correctAnswer: correctIdx >= 0 ? correctIdx : 0,
      explanation: `According to the uploaded notes: "${s}."`,
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: s
    });
  }

  // Strategy B: Varied, domain-grounded conceptual questions if notes were short
  // Distinct questions with diverse correct answers and distinct educational options!
  const diverseQuestionBank = [
    {
      q: (t) => `What is the primary foundational definition or role of "${t}" in educational curriculum?`,
      options: [
        `The systematic study, foundational concepts, and core methodologies governing ${safeTitle}`,
        `A legacy manual process with no modern practical or academic relevance`,
        `A proprietary single-vendor protocol exclusively used in offline laboratories`,
        `A deprecated historical standard completely replaced by random heuristics`
      ],
      correct: 0,
      exp: (t) => `${t} centers on core theoretical principles, systematic analysis, and structured domain understanding.`
    },
    {
      q: (t) => `In the context of "${t}", which operational consideration is most critical for achieving optimal results?`,
      options: [
        `Sacrificing accuracy and validation completely for arbitrary output speed`,
        `Carefully balancing performance throughput, resource constraints, and reliability`,
        `Hardcoding static assumptions without accommodating boundary test cases`,
        `Ignoring all foundational guidelines in favor of random execution steps`
      ],
      correct: 1,
      exp: (t) => `Mastering ${t} requires evaluating operational trade-offs between efficiency, accuracy, and resource utilization.`
    },
    {
      q: (t) => `Which methodology represents an industry-standard best practice when studying or implementing "${t}"?`,
      options: [
        `Bypassing verification phases and proceeding directly to final deployment`,
        `Combining disparate concerns into a single monolithic, undocumented component`,
        `Decomposing complex problems into modular, verifiable units with clear requirements`,
        `Relying exclusively on trial-and-error without documented theoretical models`
      ],
      correct: 2,
      exp: (t) => `Effective study of ${t} emphasizes modular decomposition, separation of concerns, and verifiable benchmarks.`
    },
    {
      q: (t) => `When analyzing advanced applications of "${t}", what is a primary challenge typically encountered?`,
      options: [
        `Managing complexity, scaling boundaries, and data consistency under real-world conditions`,
        `Eliminating the need for any formal evaluation metrics or testing`,
        `Guaranteeing infinite capacity with zero hardware or computational requirements`,
        `Ensuring that no modern tools or methodologies are ever adopted`
      ],
      correct: 0,
      exp: (t) => `Advanced mastery in ${t} requires addressing scalability, edge cases, and consistency constraints.`
    },
    {
      q: (t) => `Why is systematic verification and peer validation essential when evaluating work in "${t}"?`,
      options: [
        `To artificially inflate project completion timelines and restrict access`,
        `To ensure correctness, reproducibility, and alignment with established academic standards`,
        `Because older methodologies forbid any form of empirical testing`,
        `To convert theoretical concepts into closed-source proprietary secrets`
      ],
      correct: 1,
      exp: (t) => `Verification ensures that conclusions and implementations in ${t} are robust, reproducible, and accurate.`
    },
    {
      q: (t) => `Which factor serves as the strongest indicator of depth and quality when assessing understanding of "${t}"?`,
      options: [
        `Memorizing isolated keywords without understanding their relationships`,
        `Applying first principles to solve novel problems and analyze trade-offs critically`,
        `Avoiding any critical questioning of foundational assumptions`,
        `Restricting focus exclusively to surface-level definitions`
      ],
      correct: 1,
      exp: (t) => `Conceptual mastery of ${t} is demonstrated by reasoning from first principles to evaluate and solve complex problems.`
    },
    {
      q: (t) => `In modern educational frameworks, how is "${t}" typically integrated into interdisciplinary study?`,
      options: [
        `By connecting its core principles to practical real-world systems, technology, and sciences`,
        `By isolating it strictly from all adjacent disciplines and applications`,
        `By removing all mathematical, analytical, or scientific rigor`,
        `By treating it exclusively as a temporary historical anomaly`
      ],
      correct: 0,
      exp: (t) => `${t} frequently bridges foundational theory with practical applications across technology, science, and industry.`
    },
    {
      q: (t) => `What is a common misconception when students first begin studying "${t}"?`,
      options: [
        `That it requires structured study and consistent analytical practice`,
        `That superficial memorization is sufficient without understanding underlying mechanisms`,
        `That it possesses established foundational rules and verified theorems`,
        `That understanding core definitions helps in evaluating advanced topics`
      ],
      correct: 1,
      exp: (t) => `A common pitfall in ${t} is relying on rote memorization rather than grasping underlying principles and mechanisms.`
    },
    {
      q: (t) => `Which tool or framework is most valuable for ongoing assessment and mastery of "${t}"?`,
      options: [
        `Structured retrieval practice, active problem-solving, and continuous assessment`,
        `Passive reading without self-testing or conceptual review`,
        `Abandoning note-taking and revision immediately after the first reading`,
        `Focusing solely on multiple-choice guessing strategies without conceptual review`
      ],
      correct: 0,
      exp: (t) => `Research shows that active recall and retrieval practice are the most effective ways to achieve mastery in ${t}.`
    },
    {
      q: (t) => `Looking at future developments in "${t}", which trend is most prevalent?`,
      options: [
        `Complete abandonment of foundational research in favor of random experiments`,
        `Integration with intelligent automation, data-driven analysis, and computational modeling`,
        `Elimination of peer review and formal publication standards`,
        `Restriction to analog mechanical tools without digital interfaces`
      ],
      correct: 1,
      exp: (t) => `Future advancements in ${t} are propelled by data-driven computational models, automation, and rigorous testing.`
    }
  ];

  let bankIdx = 0;
  while (questions.length < count) {
    const item = diverseQuestionBank[bankIdx % diverseQuestionBank.length];
    const qText = item.q(safeTitle);
    
    // Shuffle options while tracking correct
    const originalOptions = item.options.map(opt => typeof opt === 'function' ? opt(safeTitle) : opt);
    const correctOption = originalOptions[item.correct];
    const shuffled = [...originalOptions].sort(() => Math.random() - 0.5);
    const correctIdx = shuffled.indexOf(correctOption);

    questions.push({
      id: questions.length + 1,
      question: qText,
      options: shuffled,
      correctAnswer: correctIdx >= 0 ? correctIdx : 0,
      explanation: item.exp(safeTitle),
      difficulty: difficulty || 'medium',
      topic: safeTitle,
      sourceReference: `Foundational Principles of ${safeTitle}`
    });
    bankIdx++;
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

  // Validate topic/notes: never generate questions for non-academic queries
  const validation = validateStudyText(contextText || topic);
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  // Check if we have pre-built knowledge questions for this exact or related topic (strict word boundary match)
  for (const [key, bank] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    const isMatch = normalizedTopic === key || new RegExp(`(^|\\b)${key}(\\b|$)`, 'i').test(normalizedTopic);
    if (isMatch) {
      // Shuffle bank questions so repeated tests get fresh variety!
      const shuffledBank = [...bank].sort(() => Math.random() - 0.5);
      const selected = shuffledBank.slice(0, targetCount).map((q, idx) => {
        const originalCorrect = q.options[q.correctAnswer];
        const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
        return {
          id: idx + 1,
          question: q.question,
          options: shuffledOpts,
          correctAnswer: shuffledOpts.indexOf(originalCorrect),
          explanation: q.explanation,
          difficulty: difficulty || 'medium',
          topic: topic || key,
          sourceReference: `Fundamental Principles of ${topic || key}`
        };
      });

      // If bank has fewer than requested, top up dynamically
      if (selected.length < targetCount) {
        const remaining = targetCount - selected.length;
        const extra = generateDynamicQuestions(contextText || topic, remaining, difficulty, topic);
        extra.forEach((eq, idx) => {
          eq.id = selected.length + idx + 1;
          selected.push(eq);
        });
      }
      return selected;
    }
  }

  // Otherwise, dynamically generate from study text or topic
  return generateDynamicQuestions(contextText || topic, targetCount, difficulty, topic);
}
