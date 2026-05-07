Feature: Dealing and bidding in standard Skat
  The auction and deal must follow the standard three-player Skat flow.

  Background:
    Given a standard three-player Skat table
    And the deck is shuffled deterministically for the test seed
    And no card has been revealed from the skat

  Rule: Standard deal structure
    Scenario: Each player receives ten cards and the skat contains two cards
      When the cards are dealt
      Then each player has exactly ten cards
      And the skat contains exactly two cards
      And the full deck still contains 120 eyes internally

    Scenario: The dealer rotates left after a completed game
      Given one full game has been completed
      When the next game starts
      Then the dealer is the next seat to the left

  Rule: Bidding order and legal bids
    Scenario: Vorhand starts the auction
      When the bidding phase begins
      Then the first active bidder is Vorhand
      And the bidding order proceeds clockwise

    Scenario Outline: The auction only accepts the official bid ladder
      Given the current bid is <currentBid>
      When the next bid is proposed
      Then the next legal bid is <nextBid>

      Examples:
        | currentBid | nextBid |
        | 18         | 20      |
        | 20         | 22      |
        | 22         | 23      |
        | 23         | 24      |
        | 24         | 27      |
        | 27         | 30      |
        | 30         | 33      |
        | 33         | 35      |
        | 35         | 36      |
        | 36         | 40      |
        | 40         | 44      |
        | 44         | 46      |
        | 46         | 48      |
        | 48         | 50      |
        | 50         | 54      |
        | 54         | 55      |
        | 55         | 60      |
        | 60         | 66      |
        | 66         | 70      |
        | 70         | 72      |
        | 72         | 77      |
        | 77         | 80      |
        | 80         | 84      |
        | 84         | 88      |
        | 88         | 90      |
        | 90         | 96      |
        | 96         | 99      |
        | 99         | 100     |
        | 100        | 108     |
        | 108        | 110     |
        | 110        | 121     |
        | 121        | 126     |
        | 126        | 130     |
        | 130        | 132     |
        | 132        | 135     |
        | 135        | 143     |
        | 143        | 144     |
        | 144        | 150     |
        | 150        | 154     |
        | 154        | 160     |
        | 160        | 165     |
        | 165        | 168     |
        | 168        | 176     |
        | 176        | 180     |
        | 180        | 192     |
        | 192        | 204     |
        | 204        | 216     |
        | 216        | 240     |

    Scenario: A player who cannot support the next bid must pass
      Given the current bid is above a player's ceiling
      When that player is asked to continue
      Then the player passes
      And the auction does not assign the contract to that player

    Scenario: The highest surviving bidder becomes declarer
      Given one player has made the highest legal bid
      And the other two players have passed
      When the auction resolves
      Then that player becomes declarer

    Scenario: The auction ends when the last opposing bidder passes
      Given two players have passed after a winning bid
      When the bidding phase resolves
      Then the contract is assigned
      And the game continues to contract selection

  Rule: Contract selection after winning the auction
    Scenario: The declarer may choose Grand, Null, or a suit game only
      Given the declarer has won the auction
      When the declarer chooses a game type
      Then the available choices are Grand, Null, Clubs, Spades, Hearts, and Diamonds
      And no other game type is offered

    Scenario Outline: Each suit game has the correct base value
      Given the declarer chooses a suit game with trump suit <suit>
      When the contract is created
      Then the base value is <baseValue>

      Examples:
        | suit     | baseValue |
        | Clubs    | 12        |
        | Spades   | 11        |
        | Hearts   | 10        |
        | Diamonds | 9         |

    Scenario: Hidden information from the skat is not exposed during bidding
      Given the skat cards are still hidden
      When bidding is displayed to the human
      Then the hidden skat identities are not shown
      And the protocol contains no discard details