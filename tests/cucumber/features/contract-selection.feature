Feature: Contract selection after a successful auction
  The browser must expose the official game types so the declarer can choose the final contract.

  Background:
    Given a browser game is loaded
    And the declarer seat is "Du"
    And the game phase is "Spieltyp wählen"

  Scenario Outline: The declarer can choose an official contract type
    When the declarer chooses the contract "<type>"
    Then the contract label contains "<label>"
    And the phase is "Skat aufnehmen / ablegen"

    Examples:
      | type      | label       |
      | grand       | Grand           |
      | null        | Null            |
      | suit:Clubs   | Kreuz (Clubs)   |
      | suit:Spades  | Pik (Spades)    |
      | suit:Hearts  | Herz (Hearts)   |
      | suit:Diamonds | Karo (Diamonds) |
