Feature: Contract and trump behavior
  The selected contract determines trump order, card ordering, and legal strength comparisons.

  Background:
    Given a declared contract exists
    And the game uses a deterministic test seed

  Rule: Suit game trump structure
    Scenario: Suit game trump structure: Clubs
      Given the contract is a suit game with trump suit Clubs
      When trump strength is calculated
      Then the jacks are higher than every card of the trump suit
      And the trump suit cards are higher than every non-trump suit card

    Scenario: Suit game trump structure: Spades
      Given the contract is a suit game with trump suit Spades
      When trump strength is calculated
      Then the jacks are higher than every card of the trump suit
      And the trump suit cards are higher than every non-trump suit card

    Scenario: Suit game trump structure: Hearts
      Given the contract is a suit game with trump suit Hearts
      When trump strength is calculated
      Then the jacks are higher than every card of the trump suit
      And the trump suit cards are higher than every non-trump suit card

    Scenario: Suit game trump structure: Diamonds
      Given the contract is a suit game with trump suit Diamonds
      When trump strength is calculated
      Then the jacks are higher than every card of the trump suit
      And the trump suit cards are higher than every non-trump suit card
    Scenario: The jack order in a suit game is Clubs, Spades, Hearts, Diamonds
      Given the contract is a suit game
      When two or more jacks are compared
      Then Clubs is higher than Spades
      And Spades is higher than Hearts
      And Hearts is higher than Diamonds

    Scenario: The trump suit cards follow the jack order
      Given the contract is a suit game with Hearts as trump
      When Hearts cards are ordered for play
      Then Ace is higher than Ten
      And Ten is higher than King
      And King is higher than Queen
      And Queen is higher than Nine
      And Nine is higher than Eight
      And Eight is higher than Seven

  Rule: Grand behavior
    Scenario: In Grand, only jacks are trumps
      Given the contract is Grand
      When trump candidates are listed
      Then only the four jacks are trumps
      And every non-jack card is a plain suit card

    Scenario: In Grand, the jack order is the only trump order
      Given the contract is Grand
      When two jacks are compared
      Then Clubs is higher than Spades
      And Spades is higher than Hearts
      And Hearts is higher than Diamonds

    Scenario: In Grand, suit cards retain their suit order outside trump play
      Given the contract is Grand
      When Hearts cards are sorted within their suit
      Then Ace is higher than Ten
      And Ten is higher than King
      And King is higher than Queen
      And Queen is higher than Nine
      And Nine is higher than Eight
      And Eight is higher than Seven

  Rule: Null behavior
    Scenario: In Null, there are no trumps
      Given the contract is Null
      When trump candidates are listed
      Then no card is a trump

    Scenario: Null order: Clubs
      Given the contract is Null
      When the cards of Clubs are ordered
      Then the order is Ace, King, Queen, Jack, Ten, Nine, Eight, Seven

    Scenario: Null order: Spades
      Given the contract is Null
      When the cards of Spades are ordered
      Then the order is Ace, King, Queen, Jack, Ten, Nine, Eight, Seven

    Scenario: Null order: Hearts
      Given the contract is Null
      When the cards of Hearts are ordered
      Then the order is Ace, King, Queen, Jack, Ten, Nine, Eight, Seven

    Scenario: Null order: Diamonds
      Given the contract is Null
      When the cards of Diamonds are ordered
      Then the order is Ace, King, Queen, Jack, Ten, Nine, Eight, Seven
    Scenario: Null ignores the trump hierarchy from suit and Grand games
      Given the contract is Null
      When a jack is compared with another card
      Then the jack is not treated as trump
      And only the lead suit can win the trick

    Scenario: The human hand is sorted by trump groups before plain suits
      Given the human hand contains trumps and plain suits
      When the hand is rendered
      Then trumps appear before non-trumps
      And the order inside each group is deterministic

    Scenario: The protocol does not reveal hidden discard cards while sorting the hand
      Given the skat phase has not been completed
      When the hand is rendered and logged
      Then no hidden discard identities are revealed
      And the log stays privacy-safe
