// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract WhatToBuild {
    IERC20 public constant WXTZ = IERC20(0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb);
    uint256 public constant MIN_WXTZ = 1e18; // 1 WXTZ

    struct Suggestion {
        uint256 id;
        address author;
        string name;
        string text;
        string category;
        uint256 timestamp;
        uint256 votes;
        bool verified; // true = posted by WXTZ holder
    }

    Suggestion[] private _suggestions;
    mapping(uint256 => mapping(address => bool)) public voted;

    event SuggestionAdded(uint256 indexed id, address indexed author, string text, bool verified);
    event Upvoted(uint256 indexed id, address indexed voter);

    modifier holdsWXTZ() {
        require(WXTZ.balanceOf(msg.sender) >= MIN_WXTZ, "Must hold at least 1 WXTZ");
        _;
    }

    // Verified post — requires >= 1 WXTZ
    function addSuggestion(
        string calldata text,
        string calldata name,
        string calldata category
    ) external holdsWXTZ {
        _add(text, name, category, true);
    }

    // Guest post — anyone can post, marked as unverified
    function addSuggestionGuest(
        string calldata text,
        string calldata name,
        string calldata category
    ) external {
        _add(text, name, category, false);
    }

    function _add(
        string calldata text,
        string calldata name,
        string calldata category,
        bool verified
    ) internal {
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
            votes: 0,
            verified: verified
        }));
        emit SuggestionAdded(id, msg.sender, text, verified);
    }

    // Only verified (WXTZ holder) wallets can upvote
    function upvote(uint256 id) external holdsWXTZ {
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
