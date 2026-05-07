Feature: Trick play and legal move behavior
  The play phase must enforce legal moves and award each trick correctly.

  Background:
    Given a valid contract has been chosen
    And the play phase has started

  Rule: Follow-suit and trump obligations
    Scenario: A player must follow the led suit if they can
      Given a plain suit card has been led
      And the next player holds at least one card of that suit
      When the next player chooses a card
      Then only cards of the led suit are legal

    Scenario: A player may play any card if they cannot follow the led suit
      Given a plain suit card has been led
      And the next player holds no card of that suit
      When the next player chooses a card
      Then any card from the hand is legal

    Scenario: In a suit game, trump must be followed if trump is led and available
      Given a trump card has been led in a suit game
      And the next player holds at least one trump
      When the next player chooses a card
      Then only trumps are legal

    Scenario: In Grand, a led jack must be followed by a jack if possible
      Given a jack has been led in Grand
      And the next player holds at least one jack
      When the next player chooses a card
      Then only jacks are legal

    Scenario: In Null, the led suit must be followed if possible
      Given a card of Diamonds has been led in Null
      And the next player holds at least one Diamond
      When the next player chooses a card
      Then only Diamonds are legal

  Rule: Trick winner determination
    Scenario: The highest legal card wins a suit trick
      Given Hearts are led in a suit game
      And the trick contains multiple Hearts cards
      When the trick is resolved
      Then the highest Heart among the legal cards wins

    Scenario: A trump beats every non-trump in a suit game
      Given a suit game trick contains both trump and plain suit cards
      When the trick is resolved
      Then the highest trump wins

    Scenario: In Grand, the highest jack beats every non-jack
      Given a Grand trick contains jacks and suit cards
      When the trick is resolved
      Then the highest jack wins

    Scenario: In Null, the highest card of the led suit wins
      Given Diamonds are led in Null
      And the trick contains multiple Diamonds cards
      When the trick is resolved
      Then the highest Diamond wins

    Scenario: The trick winner always leads the next trick
      Given a trick has just been resolved
      When the next trick starts
      Then the winner of the previous trick leads

  Rule: Illegal move handling
    Scenario: An illegal move is rejected and does not advance the trick
      Given only one suit is legal
      When the player attempts a different suit
      Then the move is rejected
      And the trick state does not advance
      And the legal move hint remains visible

    Scenario: The play phase ends after ten completed tricks
      Given nine tricks have already been completed
      When the tenth trick is resolved
      Then the play phase ends
      And the game can move to the result phase