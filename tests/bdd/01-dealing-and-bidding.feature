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
    Scenario: The player left of the dealer speaks first
      When the bidding phase begins
      Then the first active bidder is the player left of the dealer
      And the bidding order proceeds clockwise

    Scenario: After both opponents finish, the dealer speaks next
      Given both opponents have passed
      When bidding continues
      Then the dealer becomes the next speaker

    Scenario: Bid ladder 18 to 20
      Given the current bid is 18
      When the next bid is proposed
      Then the next legal bid is 20

    Scenario: Bid ladder 20 to 22
      Given the current bid is 20
      When the next bid is proposed
      Then the next legal bid is 22

    Scenario: Bid ladder 22 to 23
      Given the current bid is 22
      When the next bid is proposed
      Then the next legal bid is 23

    Scenario: Bid ladder 23 to 24
      Given the current bid is 23
      When the next bid is proposed
      Then the next legal bid is 24

    Scenario: Bid ladder 24 to 27
      Given the current bid is 24
      When the next bid is proposed
      Then the next legal bid is 27

    Scenario: Bid ladder 27 to 30
      Given the current bid is 27
      When the next bid is proposed
      Then the next legal bid is 30

    Scenario: Bid ladder 30 to 33
      Given the current bid is 30
      When the next bid is proposed
      Then the next legal bid is 33

    Scenario: Bid ladder 33 to 35
      Given the current bid is 33
      When the next bid is proposed
      Then the next legal bid is 35

    Scenario: Bid ladder 35 to 36
      Given the current bid is 35
      When the next bid is proposed
      Then the next legal bid is 36

    Scenario: Bid ladder 36 to 40
      Given the current bid is 36
      When the next bid is proposed
      Then the next legal bid is 40

    Scenario: Bid ladder 40 to 44
      Given the current bid is 40
      When the next bid is proposed
      Then the next legal bid is 44

    Scenario: Bid ladder 44 to 46
      Given the current bid is 44
      When the next bid is proposed
      Then the next legal bid is 46

    Scenario: Bid ladder 46 to 48
      Given the current bid is 46
      When the next bid is proposed
      Then the next legal bid is 48

    Scenario: Bid ladder 48 to 50
      Given the current bid is 48
      When the next bid is proposed
      Then the next legal bid is 50

    Scenario: Bid ladder 50 to 54
      Given the current bid is 50
      When the next bid is proposed
      Then the next legal bid is 54

    Scenario: Bid ladder 54 to 55
      Given the current bid is 54
      When the next bid is proposed
      Then the next legal bid is 55

    Scenario: Bid ladder 55 to 60
      Given the current bid is 55
      When the next bid is proposed
      Then the next legal bid is 60

    Scenario: Bid ladder 60 to 66
      Given the current bid is 60
      When the next bid is proposed
      Then the next legal bid is 66

    Scenario: Bid ladder 66 to 70
      Given the current bid is 66
      When the next bid is proposed
      Then the next legal bid is 70

    Scenario: Bid ladder 70 to 72
      Given the current bid is 70
      When the next bid is proposed
      Then the next legal bid is 72

    Scenario: Bid ladder 72 to 77
      Given the current bid is 72
      When the next bid is proposed
      Then the next legal bid is 77

    Scenario: Bid ladder 77 to 80
      Given the current bid is 77
      When the next bid is proposed
      Then the next legal bid is 80

    Scenario: Bid ladder 80 to 84
      Given the current bid is 80
      When the next bid is proposed
      Then the next legal bid is 84

    Scenario: Bid ladder 84 to 88
      Given the current bid is 84
      When the next bid is proposed
      Then the next legal bid is 88

    Scenario: Bid ladder 88 to 90
      Given the current bid is 88
      When the next bid is proposed
      Then the next legal bid is 90

    Scenario: Bid ladder 90 to 96
      Given the current bid is 90
      When the next bid is proposed
      Then the next legal bid is 96

    Scenario: Bid ladder 96 to 99
      Given the current bid is 96
      When the next bid is proposed
      Then the next legal bid is 99

    Scenario: Bid ladder 99 to 100
      Given the current bid is 99
      When the next bid is proposed
      Then the next legal bid is 100

    Scenario: Bid ladder 100 to 108
      Given the current bid is 100
      When the next bid is proposed
      Then the next legal bid is 108

    Scenario: Bid ladder 108 to 110
      Given the current bid is 108
      When the next bid is proposed
      Then the next legal bid is 110

    Scenario: Bid ladder 110 to 121
      Given the current bid is 110
      When the next bid is proposed
      Then the next legal bid is 121

    Scenario: Bid ladder 121 to 126
      Given the current bid is 121
      When the next bid is proposed
      Then the next legal bid is 126

    Scenario: Bid ladder 126 to 130
      Given the current bid is 126
      When the next bid is proposed
      Then the next legal bid is 130

    Scenario: Bid ladder 130 to 132
      Given the current bid is 130
      When the next bid is proposed
      Then the next legal bid is 132

    Scenario: Bid ladder 132 to 135
      Given the current bid is 132
      When the next bid is proposed
      Then the next legal bid is 135

    Scenario: Bid ladder 135 to 143
      Given the current bid is 135
      When the next bid is proposed
      Then the next legal bid is 143

    Scenario: Bid ladder 143 to 144
      Given the current bid is 143
      When the next bid is proposed
      Then the next legal bid is 144

    Scenario: Bid ladder 144 to 150
      Given the current bid is 144
      When the next bid is proposed
      Then the next legal bid is 150

    Scenario: Bid ladder 150 to 154
      Given the current bid is 150
      When the next bid is proposed
      Then the next legal bid is 154

    Scenario: Bid ladder 154 to 160
      Given the current bid is 154
      When the next bid is proposed
      Then the next legal bid is 160

    Scenario: Bid ladder 160 to 165
      Given the current bid is 160
      When the next bid is proposed
      Then the next legal bid is 165

    Scenario: Bid ladder 165 to 168
      Given the current bid is 165
      When the next bid is proposed
      Then the next legal bid is 168

    Scenario: Bid ladder 168 to 176
      Given the current bid is 168
      When the next bid is proposed
      Then the next legal bid is 176

    Scenario: Bid ladder 176 to 180
      Given the current bid is 176
      When the next bid is proposed
      Then the next legal bid is 180

    Scenario: Bid ladder 180 to 192
      Given the current bid is 180
      When the next bid is proposed
      Then the next legal bid is 192

    Scenario: Bid ladder 192 to 204
      Given the current bid is 192
      When the next bid is proposed
      Then the next legal bid is 204

    Scenario: Bid ladder 204 to 216
      Given the current bid is 204
      When the next bid is proposed
      Then the next legal bid is 216

    Scenario: Bid ladder 216 to 240
      Given the current bid is 216
      When the next bid is proposed
      Then the next legal bid is 240
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

    Scenario: The declarer may choose Grand, Null, or a suit game only
      Given the declarer has won the auction
      When the declarer chooses a game type
      Then the available choices are Grand, Null, Clubs, Spades, Hearts, and Diamonds
      And no other game type is offered

    Scenario: Suit game base value: Clubs
      Given the declarer chooses a suit game with trump suit Clubs
      When the contract is created
      Then the base value is 12

    Scenario: Suit game base value: Spades
      Given the declarer chooses a suit game with trump suit Spades
      When the contract is created
      Then the base value is 11

    Scenario: Suit game base value: Hearts
      Given the declarer chooses a suit game with trump suit Hearts
      When the contract is created
      Then the base value is 10

    Scenario: Suit game base value: Diamonds
      Given the declarer chooses a suit game with trump suit Diamonds
      When the contract is created
      Then the base value is 9
    Scenario: Hidden information from the skat is not exposed during bidding
      Given the skat cards are still hidden
      When bidding is displayed to the human
      Then the hidden skat identities are not shown
      And the protocol contains no discard details
