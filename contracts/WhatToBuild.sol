// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WhatToBuild {
    struct Suggestion {
        uint256 id;
        address author;
        string name;
        string text;
        string category;
        uint256 timestamp;
        uint256 votes;
    }

    Suggestion[] private _suggestions;
    mapping(uint256 => mapping(address => bool)) public voted;

    event SuggestionAdded(uint256 indexed id, address indexed author, string text);
    event Upvoted(uint256 indexed id, address indexed voter);

    modifier holdsXTZ() {
        require(msg.sender.balance >= 0.01 ether, "Must hold at least 0.01 XTZ");
        _;
    }

    function addSuggestion(
        string calldata text,
        string calldata name,
        string calldata category
    ) external holdsXTZ {
        require(bytes(text).length > 0, "Text cannot be empty");
        require(bytes(text).length <= 280, "Text too long");
        require(bytes(name).length <= 50, "Name too long");
        require(bytes(category).length > 0, "Category required");
        uint256 id = _suggestions.length;
        _suggestions.push(Suggestion({
            id: id,
            author: msg.sender,
            name: name,
            text: text,
            category: category,
            timestamp: block.timestamp,
            votes: 0
        }));
        emit SuggestionAdded(id, msg.sender, text);
    }

    function upvote(uint256 id) external holdsXTZ {
        require(id < _suggestions.length, "Invalid suggestion");
        require(!voted[id][msg.sender], "Already voted");
        voted[id][msg.sender] = true;
        _suggestions[id].votes += 1;
        emit Upvoted(id, msg.sender);
    }

    function getSuggestions() external view returns (Suggestion[] memory) {
        return _suggestions;
    }

    function getSuggestionCount() external view returns (uint256) {
        return _suggestions.length;
    }
}
