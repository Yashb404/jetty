/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/jetty.json`.
 */
export type Jetty = {
  "address": "4DcxDMd7iFppUn6aGkuJY3xNaF9FFNduchqByYmXiKku",
  "metadata": {
    "name": "jetty",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "assignPolicyAuthority",
      "discriminator": [
        12,
        50,
        127,
        32,
        159,
        70,
        248,
        154
      ],
      "accounts": [
        {
          "name": "currentAuthority",
          "docs": [
            "The current policy authority. Must sign to authorise the rotation."
          ],
          "signer": true
        },
        {
          "name": "newAuthority",
          "docs": [
            "The incoming policy authority. Must also sign so that we prove the new",
            "key is live and the operator is not accidentally locking the config to",
            "an unreachable address."
          ],
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "clearVestingLock",
      "discriminator": [
        157,
        2,
        142,
        53,
        233,
        4,
        57,
        5
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenAccount"
        },
        {
          "name": "vestingEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "tokenAccount"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "execute",
      "discriminator": [
        105,
        37,
        101,
        197,
        75,
        251,
        102,
        26
      ],
      "accounts": [
        {
          "name": "sourceTokenAccount"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationTokenAccount"
        },
        {
          "name": "authority",
          "docs": [
            "The authority (source owner). Not a signer for CPIs from the token program.",
            "require it to be a signer because the token program will invoke this",
            "instruction during transfers without the authority flagged as a signer."
          ]
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initCooldownEntry",
      "discriminator": [
        141,
        111,
        127,
        103,
        21,
        108,
        100,
        190
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenAccount"
        },
        {
          "name": "cooldownEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  111,
                  108,
                  100,
                  111,
                  119,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initExtraAccountMetaList",
      "discriminator": [
        16,
        12,
        254,
        251,
        252,
        103,
        115,
        58
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeHookConfig",
      "discriminator": [
        144,
        239,
        17,
        85,
        228,
        48,
        54,
        43
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setVestingLock",
      "discriminator": [
        82,
        140,
        147,
        145,
        172,
        241,
        217,
        234
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenAccount"
        },
        {
          "name": "vestingEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "unlockTimestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "updateAllowlist",
      "discriminator": [
        138,
        59,
        153,
        23,
        244,
        206,
        40,
        245
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenAccount",
          "docs": [
            "It does not need to be initialized yet — enabling allowlisting an ATA",
            "atomically in the same transaction as its creation."
          ]
        },
        {
          "name": "allowlistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  108,
                  108,
                  111,
                  119,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updateDenylist",
      "discriminator": [
        61,
        158,
        149,
        70,
        107,
        53,
        26,
        63
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "tokenAccount"
        },
        {
          "name": "denylistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  110,
                  121,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "tokenAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "flagged",
          "type": "bool"
        }
      ]
    },
    {
      "name": "updatePolicy",
      "discriminator": [
        212,
        245,
        246,
        7,
        163,
        151,
        18,
        57
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "policyAuthority",
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updatePolicyArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "allowlistEntry",
      "discriminator": [
        42,
        59,
        88,
        1,
        124,
        138,
        92,
        236
      ]
    },
    {
      "name": "cooldownEntry",
      "discriminator": [
        133,
        235,
        219,
        236,
        44,
        236,
        82,
        142
      ]
    },
    {
      "name": "denylistEntry",
      "discriminator": [
        2,
        44,
        7,
        103,
        34,
        229,
        136,
        179
      ]
    },
    {
      "name": "hookConfig",
      "discriminator": [
        137,
        155,
        101,
        95,
        138,
        72,
        8,
        182
      ]
    },
    {
      "name": "vestingEntry",
      "discriminator": [
        18,
        55,
        48,
        24,
        157,
        78,
        194,
        80
      ]
    }
  ],
  "events": [
    {
      "name": "hookConfigInitialized",
      "discriminator": [
        229,
        103,
        225,
        17,
        30,
        200,
        107,
        228
      ]
    },
    {
      "name": "policyAuthorityAssigned",
      "discriminator": [
        236,
        211,
        74,
        227,
        164,
        171,
        133,
        132
      ]
    },
    {
      "name": "policyUpdated",
      "discriminator": [
        225,
        112,
        112,
        67,
        95,
        236,
        245,
        161
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "transferPaused",
      "msg": "Transfers for this mint are currently paused."
    },
    {
      "code": 6001,
      "name": "exceedsVolumeLimit",
      "msg": "Transfer amount exceeds the configured volume limit."
    },
    {
      "code": 6002,
      "name": "sourceNotAllowlisted",
      "msg": "Source wallet is not on the allowlist."
    },
    {
      "code": 6003,
      "name": "destinationNotAllowlisted",
      "msg": "Destination wallet is not on the allowlist."
    },
    {
      "code": 6004,
      "name": "unauthorized",
      "msg": "Caller is not the policy authority for this mint."
    },
    {
      "code": 6005,
      "name": "notTransferring",
      "msg": "The source token account is not in a transferring state. Direct invocation is not permitted."
    },
    {
      "code": 6006,
      "name": "mintMismatch",
      "msg": "Mint mismatch between instruction accounts and stored config."
    },
    {
      "code": 6007,
      "name": "invalidTokenProgram",
      "msg": "The provided token program is not Token-2022."
    },
    {
      "code": 6008,
      "name": "invalidMetaListOwner",
      "msg": "The extra account meta list is not owned by this program."
    },
    {
      "code": 6009,
      "name": "invalidAuthority",
      "msg": "The provided authority does not match the source token account owner."
    },
    {
      "code": 6010,
      "name": "extraMetaListNotInitialized",
      "msg": "The extra account meta list has not been initialized for this mint."
    },
    {
      "code": 6011,
      "name": "metaListSizeOverflow",
      "msg": "The computed extra account meta list size exceeds safe bounds."
    },
    {
      "code": 6012,
      "name": "tokensLocked",
      "msg": "Tokens are locked until the vesting period expires."
    },
    {
      "code": 6013,
      "name": "belowMinimumTransferAmount",
      "msg": "Transfer amount is below the configured minimum transfer amount."
    },
    {
      "code": 6014,
      "name": "exceedsHolderCap",
      "msg": "Transfer would exceed the receiver's maximum allowed balance cap."
    },
    {
      "code": 6015,
      "name": "invalidBps",
      "msg": "Basis points must be between 0 and 10000."
    },
    {
      "code": 6016,
      "name": "sourceDenylisted",
      "msg": "Source wallet is blocked on the denylist."
    },
    {
      "code": 6017,
      "name": "destinationDenylisted",
      "msg": "Destination wallet is blocked on the denylist."
    },
    {
      "code": 6018,
      "name": "cooldownNotExpired",
      "msg": "You must wait for the cooldown period to expire before transferring again."
    },
    {
      "code": 6019,
      "name": "cooldownEntryMissing",
      "msg": "A Cooldown PDA is required but missing."
    },
    {
      "code": 6020,
      "name": "invalidTransferBounds",
      "msg": "Minimum transfer amount cannot exceed maximum transfer amount."
    }
  ],
  "types": [
    {
      "name": "allowlistEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "docs": [
              "The token account address used as the allowlist seed.",
              "This is the ATA (or any Token-2022 account) for the wallet,",
              "NOT the wallet owner pubkey — enabling atomic same-tx ATA initialization."
            ],
            "type": "pubkey"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "cooldownEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "lastTransferTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "denylistEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "flagged",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "hookConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "policyAuthority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "allowlistEnabled",
            "type": "bool"
          },
          {
            "name": "maxTransferAmount",
            "type": "u64"
          },
          {
            "name": "vestingEnabled",
            "type": "bool"
          },
          {
            "name": "minTransferAmount",
            "type": "u64"
          },
          {
            "name": "maxHolderBps",
            "type": "u16"
          },
          {
            "name": "denylistEnabled",
            "type": "bool"
          },
          {
            "name": "cooldownSeconds",
            "docs": [
              "Cooldown is deny-by-default when enabled, unlike other modules, because it requires",
              "mutable state (last_transfer_timestamp) that the hook cannot create itself (no funding payer).",
              "Users MUST have a CooldownEntry initialized before transferring if this is > 0."
            ],
            "type": "u32"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                48
              ]
            }
          }
        ]
      }
    },
    {
      "name": "hookConfigInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "policyAuthority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "policyAuthorityAssigned",
      "docs": [
        "Emitted when the policy authority for a mint is rotated."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "oldAuthority",
            "type": "pubkey"
          },
          {
            "name": "newAuthority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "policyUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "allowlistEnabled",
            "type": "bool"
          },
          {
            "name": "maxTransferAmount",
            "type": "u64"
          },
          {
            "name": "vestingEnabled",
            "type": "bool"
          },
          {
            "name": "minTransferAmount",
            "type": "u64"
          },
          {
            "name": "maxHolderBps",
            "type": "u16"
          },
          {
            "name": "denylistEnabled",
            "type": "bool"
          },
          {
            "name": "cooldownSeconds",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updatePolicyArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "paused",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "allowlistEnabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "maxTransferAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "vestingEnabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "minTransferAmount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxHolderBps",
            "type": {
              "option": "u16"
            }
          },
          {
            "name": "denylistEnabled",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "cooldownSeconds",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "vestingEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "unlockTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
