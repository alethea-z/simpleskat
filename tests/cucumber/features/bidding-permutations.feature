Feature: Bidding permutations and declarer selection
  To verify the official bidding order, the browser test harness must be able to start from an explicit dealer and bidding fixture.

  Background:
    Given a browser game is loaded

  Scenario: Human dealer, left player wins the auction against right and dealer
    Given the dealer is "Du"
    And the current bidding seat is "KI links"
    And the bid ceilings are:
      | seat      | ceiling |
      | Du        | 18      |
      | KI links  | 84      |
      | KI rechts | 18      |
    When the browser advances the bidding
    And the human passes
    And the browser advances the bidding
    Then the declarer is "KI links"
    And the phase is "Spiel"

  Scenario: Left dealer, right player wins the auction against left and dealer
    Given the dealer is "KI links"
    And the current bidding seat is "KI rechts"
    And the bid ceilings are:
      | seat      | ceiling |
      | Du        | 18      |
      | KI links  | 18      |
      | KI rechts | 84      |
    When the browser advances the bidding
    And the human passes
    And the browser advances the bidding
    Then the declarer is "KI rechts"
    And the phase is "Spiel"

  Scenario: Right dealer, the human wins the auction against left and right
    Given the dealer is "KI rechts"
    And the current bidding seat is "Du"
    And the bid ceilings are:
      | seat      | ceiling |
      | Du        | 84      |
      | KI links  | 18      |
      | KI rechts | 18      |
    When the human bids once
    And the browser advances the bidding
    Then the declarer is "Du"
    And the phase is "Spieltyp wählen"
