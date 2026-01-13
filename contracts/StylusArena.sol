// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StylusArena
 * @notice Main contract for StylusArena - stores user profiles, stats, and game data on-chain
 */
contract StylusArena {
    // ============ STRUCTS ============
    
    struct UserProfile {
        string username;
        uint256 level;
        uint256 xp;
        uint256 totalXP;
        uint256 gamesPlayed;
        uint256 agentsTrained;
        uint256 agentsDeployed;
        uint256 wins;
        uint256 losses;
        uint256 achievementsUnlocked;
        uint256 createdAt;
        uint256 lastActiveAt;
    }

    struct Achievement {
        string name;
        string description;
        string icon;
        uint8 category; // 0=game, 1=training, 2=agent, 3=social, 4=special
        uint8 rarity; // 0=common, 1=rare, 2=epic, 3=legendary
        uint256 xpReward;
        bool isActive;
    }

    struct Tournament {
        string name;
        string description;
        uint8 gameType; // 0=racing, 1=battle, 2=puzzle
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        uint256 entryFee;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint8 status; // 0=upcoming, 1=active, 2=completed
        address[] participants;
        address winner;
        address creator;
    }

    struct Battle {
        address agent1;
        address agent2;
        uint8 gameType;
        uint256 prize;
        uint8 status; // 0=pending, 1=active, 2=completed
        address winner;
        uint256 createdAt;
        uint256 completedAt;
    }

    struct Challenge {
        string name;
        string description;
        uint8 challengeType; // 0=daily, 1=weekly, 2=special
        uint8 gameType;
        uint256 target;
        uint256 xpReward;
        uint256 tokenReward;
        uint256 expiresAt;
        bool isActive;
    }

    struct AgentInfo {
        address owner;
        string name;
        uint8 gameType;
        address contractAddress;
        uint256 accuracy; // 0-100
        uint256 winRate; // 0-100
        int256 profit; // can be negative
        uint256 deployedAt;
        bool isActive;
    }

    struct Listing {
        address agent;
        address seller;
        uint256 price;
        bool isActive;
    }

    // ============ STATE VARIABLES ============
    
    mapping(address => UserProfile) public profiles;
    mapping(address => bool) public hasProfile;
    mapping(uint256 => Achievement) public achievements;
    uint256 public achievementCount;
    mapping(address => mapping(uint256 => bool)) public userAchievements; // user => achievementId => unlocked
    
    mapping(uint256 => Tournament) public tournaments;
    uint256 public tournamentCount;
    mapping(uint256 => mapping(address => bool)) public tournamentParticipants; // tournamentId => user => registered
    
    mapping(uint256 => Battle) public battles;
    uint256 public battleCount;
    
    mapping(uint256 => Challenge) public challenges;
    uint256 public challengeCount;
    mapping(address => mapping(uint256 => uint256)) public challengeProgress; // user => challengeId => progress
    
    // Agent Management
    mapping(address => AgentInfo) public agents;
    mapping(address => address[]) public userAgents; // user => agent addresses
    uint256 public agentCount;
    
    // Marketplace
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    
    // Social
    mapping(address => address[]) public friends; // user => friend addresses
    mapping(address => mapping(address => bool)) public isFriend; // user => friend => isFriend
    
    address public owner;
    uint256 public constant XP_PER_LEVEL = 1000;
    
    // ============ EVENTS ============
    
    event ProfileCreated(address indexed user, string username);
    event LevelUp(address indexed user, uint256 newLevel);
    event AchievementUnlocked(address indexed user, uint256 achievementId);
    event TournamentCreated(uint256 indexed tournamentId, address indexed creator);
    event TournamentJoined(uint256 indexed tournamentId, address indexed participant);
    event BattleCreated(uint256 indexed battleId, address indexed agent1, address indexed agent2);
    event BattleCompleted(uint256 indexed battleId, address indexed winner);
    event ChallengeProgress(address indexed user, uint256 indexed challengeId, uint256 progress);
    event ChallengeCompleted(address indexed user, uint256 indexed challengeId);
    
    // Agent events
    event AgentRegistered(address indexed agent, address indexed owner, string name, uint8 gameType);
    event AgentMetricsUpdated(address indexed agent, uint256 accuracy, uint256 winRate, int256 profit);
    
    // Marketplace events
    event AgentListed(uint256 indexed listingId, address indexed agent, address indexed seller, uint256 price);
    event AgentSold(uint256 indexed listingId, address indexed buyer, address indexed agent);
    event ListingCancelled(uint256 indexed listingId);
    
    // Social events
    event FriendAdded(address indexed user, address indexed friend);
    
    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier hasProfileCheck() {
        require(hasProfile[msg.sender], "Profile not created");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
    }
    
    // ============ USER PROFILE FUNCTIONS ============
    
    /**
     * @notice Create a new user profile
     * @param _username Username for the profile
     */
    function createProfile(string memory _username) external {
        require(!hasProfile[msg.sender], "Profile already exists");
        require(bytes(_username).length > 0, "Username required");
        
        profiles[msg.sender] = UserProfile({
            username: _username,
            level: 1,
            xp: 0,
            totalXP: 0,
            gamesPlayed: 0,
            agentsTrained: 0,
            agentsDeployed: 0,
            wins: 0,
            losses: 0,
            achievementsUnlocked: 0,
            createdAt: block.timestamp,
            lastActiveAt: block.timestamp
        });
        
        hasProfile[msg.sender] = true;
        emit ProfileCreated(msg.sender, _username);
    }
    
    /**
     * @notice Add XP to user profile
     * @param _amount Amount of XP to add
     */
    function addXP(uint256 _amount) external hasProfileCheck {
        UserProfile storage profile = profiles[msg.sender];
        profile.xp += _amount;
        profile.totalXP += _amount;
        profile.lastActiveAt = block.timestamp;
        
        // Check for level up
        uint256 newLevel = (profile.totalXP / XP_PER_LEVEL) + 1;
        if (newLevel > profile.level) {
            profile.level = newLevel;
            emit LevelUp(msg.sender, newLevel);
        }
    }
    
    /**
     * @notice Update game stats
     * @param _won Whether the game was won
     */
    function updateGameStats(bool _won) external hasProfileCheck {
        UserProfile storage profile = profiles[msg.sender];
        profile.gamesPlayed++;
        profile.lastActiveAt = block.timestamp;
        
        if (_won) {
            profile.wins++;
        } else {
            profile.losses++;
        }
    }
    
    /**
     * @notice Update agent stats
     * @param _trained Whether an agent was trained
     * @param _deployed Whether an agent was deployed
     */
    function updateAgentStats(bool _trained, bool _deployed) external hasProfileCheck {
        UserProfile storage profile = profiles[msg.sender];
        profile.lastActiveAt = block.timestamp;
        
        if (_trained) {
            profile.agentsTrained++;
        }
        if (_deployed) {
            profile.agentsDeployed++;
        }
    }
    
    /**
     * @notice Get user profile
     * @param _user Address of the user
     * @return UserProfile struct
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return profiles[_user];
    }
    
    /**
     * @notice Get user win rate
     * @param _user Address of the user
     * @return Win rate as percentage (0-100)
     */
    function getWinRate(address _user) external view returns (uint256) {
        UserProfile memory profile = profiles[_user];
        if (profile.gamesPlayed == 0) return 0;
        return (profile.wins * 100) / profile.gamesPlayed;
    }
    
    // ============ ACHIEVEMENT FUNCTIONS ============
    
    /**
     * @notice Create a new achievement (owner only)
     */
    function createAchievement(
        string memory _name,
        string memory _description,
        string memory _icon,
        uint8 _category,
        uint8 _rarity,
        uint256 _xpReward
    ) external onlyOwner {
        achievements[achievementCount] = Achievement({
            name: _name,
            description: _description,
            icon: _icon,
            category: _category,
            rarity: _rarity,
            xpReward: _xpReward,
            isActive: true
        });
        achievementCount++;
    }
    
    /**
     * @notice Unlock an achievement for a user
     * @param _achievementId ID of the achievement
     */
    function unlockAchievement(uint256 _achievementId) external hasProfileCheck {
        require(_achievementId < achievementCount, "Invalid achievement");
        require(!userAchievements[msg.sender][_achievementId], "Already unlocked");
        require(achievements[_achievementId].isActive, "Achievement not active");
        
        userAchievements[msg.sender][_achievementId] = true;
        profiles[msg.sender].achievementsUnlocked++;
        
        // Award XP
        addXP(achievements[_achievementId].xpReward);
        
        emit AchievementUnlocked(msg.sender, _achievementId);
    }
    
    /**
     * @notice Check if user has achievement
     * @param _user Address of the user
     * @param _achievementId ID of the achievement
     * @return Whether the user has the achievement
     */
    function hasAchievement(address _user, uint256 _achievementId) external view returns (bool) {
        return userAchievements[_user][_achievementId];
    }
    
    // ============ TOURNAMENT FUNCTIONS ============
    
    /**
     * @notice Create a new tournament
     */
    function createTournament(
        string memory _name,
        string memory _description,
        uint8 _gameType,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _prizePool,
        uint256 _entryFee,
        uint256 _maxParticipants
    ) external payable {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "Invalid end time");
        require(msg.value >= _prizePool, "Insufficient prize pool");
        
        tournaments[tournamentCount] = Tournament({
            name: _name,
            description: _description,
            gameType: _gameType,
            startTime: _startTime,
            endTime: _endTime,
            prizePool: _prizePool,
            entryFee: _entryFee,
            maxParticipants: _maxParticipants,
            currentParticipants: 0,
            status: 0, // upcoming
            participants: new address[](0),
            winner: address(0),
            creator: msg.sender
        });
        
        emit TournamentCreated(tournamentCount, msg.sender);
        tournamentCount++;
    }
    
    /**
     * @notice Join a tournament
     * @param _tournamentId ID of the tournament
     */
    function joinTournament(uint256 _tournamentId) external payable hasProfileCheck {
        require(_tournamentId < tournamentCount, "Invalid tournament");
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.status == 0 || tournament.status == 1, "Tournament not open");
        require(block.timestamp >= tournament.startTime, "Tournament not started");
        require(block.timestamp < tournament.endTime, "Tournament ended");
        require(tournament.currentParticipants < tournament.maxParticipants, "Tournament full");
        require(!tournamentParticipants[_tournamentId][msg.sender], "Already joined");
        require(msg.value >= tournament.entryFee, "Insufficient entry fee");
        
        tournament.participants.push(msg.sender);
        tournament.currentParticipants++;
        tournamentParticipants[_tournamentId][msg.sender] = true;
        
        if (tournament.status == 0 && block.timestamp >= tournament.startTime) {
            tournament.status = 1; // active
        }
        
        emit TournamentJoined(_tournamentId, msg.sender);
    }
    
    /**
     * @notice Set tournament winner (owner only, or automated)
     * @param _tournamentId ID of the tournament
     * @param _winner Address of the winner
     */
    function setTournamentWinner(uint256 _tournamentId, address _winner) external onlyOwner {
        require(_tournamentId < tournamentCount, "Invalid tournament");
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.status == 1, "Tournament not active");
        
        tournament.winner = _winner;
        tournament.status = 2; // completed
        
        // Transfer prize (simplified - in production, use proper distribution)
        payable(_winner).transfer(tournament.prizePool);
    }
    
    // ============ BATTLE FUNCTIONS ============
    
    /**
     * @notice Create a new battle
     * @param _agent2 Address of the opponent agent
     * @param _gameType Type of game
     * @param _prize Prize amount
     */
    function createBattle(
        address _agent2,
        uint8 _gameType,
        uint256 _prize
    ) external payable {
        require(_agent2 != msg.sender, "Cannot battle yourself");
        require(msg.value >= _prize, "Insufficient prize");
        
        battles[battleCount] = Battle({
            agent1: msg.sender,
            agent2: _agent2,
            gameType: _gameType,
            prize: _prize,
            status: 0, // pending
            winner: address(0),
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        emit BattleCreated(battleCount, msg.sender, _agent2);
        battleCount++;
    }
    
    /**
     * @notice Complete a battle and set winner
     * @param _battleId ID of the battle
     * @param _winner Address of the winner
     */
    function completeBattle(uint256 _battleId, address _winner) external {
        require(_battleId < battleCount, "Invalid battle");
        Battle storage battle = battles[_battleId];
        require(battle.status == 1, "Battle not active");
        require(_winner == battle.agent1 || _winner == battle.agent2, "Invalid winner");
        
        battle.winner = _winner;
        battle.status = 2; // completed
        battle.completedAt = block.timestamp;
        
        // Update stats
        updateGameStats(_winner == battle.agent1);
        if (_winner == battle.agent1) {
            updateGameStats(false); // agent2 lost
        } else {
            updateGameStats(true); // agent1 lost
            updateGameStats(false); // agent2 won
        }
        
        // Transfer prize
        payable(_winner).transfer(battle.prize);
        
        emit BattleCompleted(_battleId, _winner);
    }
    
    // ============ CHALLENGE FUNCTIONS ============
    
    /**
     * @notice Create a challenge (owner only)
     */
    function createChallenge(
        string memory _name,
        string memory _description,
        uint8 _challengeType,
        uint8 _gameType,
        uint256 _target,
        uint256 _xpReward,
        uint256 _tokenReward,
        uint256 _expiresAt
    ) external onlyOwner {
        challenges[challengeCount] = Challenge({
            name: _name,
            description: _description,
            challengeType: _challengeType,
            gameType: _gameType,
            target: _target,
            xpReward: _xpReward,
            tokenReward: _tokenReward,
            expiresAt: _expiresAt,
            isActive: true
        });
        challengeCount++;
    }
    
    /**
     * @notice Update challenge progress
     * @param _challengeId ID of the challenge
     * @param _progress New progress value
     */
    function updateChallengeProgress(uint256 _challengeId, uint256 _progress) external hasProfileCheck {
        require(_challengeId < challengeCount, "Invalid challenge");
        Challenge storage challenge = challenges[_challengeId];
        require(challenge.isActive, "Challenge not active");
        require(block.timestamp < challenge.expiresAt, "Challenge expired");
        
        challengeProgress[msg.sender][_challengeId] = _progress;
        emit ChallengeProgress(msg.sender, _challengeId, _progress);
        
        // Check if completed
        if (_progress >= challenge.target) {
            addXP(challenge.xpReward);
            emit ChallengeCompleted(msg.sender, _challengeId);
        }
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Withdraw funds (owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    // ============ AGENT MANAGEMENT FUNCTIONS ============
    
    /**
     * @notice Register a deployed agent
     * @param _name Name of the agent
     * @param _gameType Game type (0=racing, 1=battle, 2=puzzle, etc.)
     * @param _contractAddress Address of the deployed Stylus contract
     */
    function registerAgent(
        string memory _name,
        uint8 _gameType,
        address _contractAddress
    ) external hasProfileCheck {
        require(_contractAddress != address(0), "Invalid contract address");
        require(bytes(_name).length > 0, "Name required");
        
        agents[_contractAddress] = AgentInfo({
            owner: msg.sender,
            name: _name,
            gameType: _gameType,
            contractAddress: _contractAddress,
            accuracy: 0,
            winRate: 0,
            profit: 0,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        userAgents[msg.sender].push(_contractAddress);
        agentCount++;
        
        // Update agent stats
        updateAgentStats(false, true);
        
        emit AgentRegistered(_contractAddress, msg.sender, _name, _gameType);
    }
    
    /**
     * @notice Update agent performance metrics
     * @param _agent Address of the agent contract
     * @param _accuracy Accuracy percentage (0-100)
     * @param _winRate Win rate percentage (0-100)
     * @param _profit Profit/loss (can be negative)
     */
    function updateAgentMetrics(
        address _agent,
        uint256 _accuracy,
        uint256 _winRate,
        int256 _profit
    ) external {
        require(agents[_agent].owner == msg.sender || msg.sender == owner, "Not authorized");
        require(agents[_agent].isActive, "Agent not active");
        require(_accuracy <= 100, "Invalid accuracy");
        require(_winRate <= 100, "Invalid win rate");
        
        agents[_agent].accuracy = _accuracy;
        agents[_agent].winRate = _winRate;
        agents[_agent].profit = _profit;
        
        emit AgentMetricsUpdated(_agent, _accuracy, _winRate, _profit);
    }
    
    /**
     * @notice Get agent info
     * @param _agent Address of the agent contract
     * @return AgentInfo struct
     */
    function getAgentInfo(address _agent) external view returns (AgentInfo memory) {
        return agents[_agent];
    }
    
    /**
     * @notice Get all agents owned by a user
     * @param _user Address of the user
     * @return Array of agent addresses
     */
    function getUserAgents(address _user) external view returns (address[] memory) {
        return userAgents[_user];
    }
    
    // ============ MARKETPLACE FUNCTIONS ============
    
    /**
     * @notice List an agent for sale
     * @param _agent Address of the agent contract
     * @param _price Price in wei
     */
    function listAgent(address _agent, uint256 _price) external {
        require(agents[_agent].owner == msg.sender, "Not agent owner");
        require(agents[_agent].isActive, "Agent not active");
        require(_price > 0, "Price must be > 0");
        
        listings[listingCount] = Listing({
            agent: _agent,
            seller: msg.sender,
            price: _price,
            isActive: true
        });
        
        emit AgentListed(listingCount, _agent, msg.sender, _price);
        listingCount++;
    }
    
    /**
     * @notice Buy an agent from marketplace
     * @param _listingId ID of the listing
     */
    function buyAgent(uint256 _listingId) external payable {
        require(_listingId < listingCount, "Invalid listing");
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Transfer agent ownership
        agents[listing.agent].owner = msg.sender;
        
        // Remove from seller's agents, add to buyer's
        address[] storage sellerAgents = userAgents[listing.seller];
        for (uint256 i = 0; i < sellerAgents.length; i++) {
            if (sellerAgents[i] == listing.agent) {
                sellerAgents[i] = sellerAgents[sellerAgents.length - 1];
                sellerAgents.pop();
                break;
            }
        }
        userAgents[msg.sender].push(listing.agent);
        
        // Transfer payment
        payable(listing.seller).transfer(listing.price);
        
        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        listing.isActive = false;
        
        emit AgentSold(_listingId, msg.sender, listing.agent);
    }
    
    /**
     * @notice Cancel a listing
     * @param _listingId ID of the listing
     */
    function cancelListing(uint256 _listingId) external {
        require(_listingId < listingCount, "Invalid listing");
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.isActive, "Already cancelled");
        
        listing.isActive = false;
        
        emit ListingCancelled(_listingId);
    }
    
    /**
     * @notice Get listing info
     * @param _listingId ID of the listing
     * @return Listing struct
     */
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }
    
    // ============ SOCIAL FUNCTIONS ============
    
    /**
     * @notice Add a friend
     * @param _friend Address of the friend
     */
    function addFriend(address _friend) external hasProfileCheck {
        require(_friend != msg.sender, "Cannot add yourself");
        require(_friend != address(0), "Invalid address");
        require(!isFriend[msg.sender][_friend], "Already friends");
        require(hasProfile[_friend], "Friend has no profile");
        
        friends[msg.sender].push(_friend);
        isFriend[msg.sender][_friend] = true;
        
        emit FriendAdded(msg.sender, _friend);
    }
    
    /**
     * @notice Get friends list
     * @param _user Address of the user
     * @return Array of friend addresses
     */
    function getFriends(address _user) external view returns (address[] memory) {
        return friends[_user];
    }
    
    /**
     * @notice Check if two users are friends
     * @param _user1 First user address
     * @param _user2 Second user address
     * @return Whether they are friends
     */
    function areFriends(address _user1, address _user2) external view returns (bool) {
        return isFriend[_user1][_user2];
    }
}


