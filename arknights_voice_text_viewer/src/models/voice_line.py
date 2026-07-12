from dataclasses import dataclass, field


@dataclass(frozen=True)
class VoiceLine:
    char_word_id: str
    word_key: str
    char_id: str
    voice_id: str
    voice_text: str
    voice_title: str
    voice_index: int
    voice_type: str
    unlock_type: str
    place_type: str
    voice_asset: str
    unlock_params: tuple[int, ...] = field(default_factory=tuple)
    lock_description: str = ""

    @classmethod
    def from_dict(cls, data):
        unlock_param = data.get("unlockParam", [])
        if not isinstance(unlock_param, list):
            unlock_param = []

        return cls(
            char_word_id=data["charWordId"],
            word_key=data["wordKey"],
            char_id=data["charId"],
            voice_id=data["voiceId"],
            voice_text=data.get("voiceText", ""),
            voice_title=data.get("voiceTitle", ""),
            voice_index=int(data.get("voiceIndex", 0)),
            voice_type=data.get("voiceType", ""),
            unlock_type=data.get("unlockType", "DIRECT"),
            place_type=data.get("placeType", ""),
            voice_asset=data.get("voiceAsset", ""),
            unlock_params=tuple(
                int(param["valueInt"])
                for param in unlock_param
                if isinstance(param, dict) and "valueInt" in param
            ),
            lock_description=data.get("lockDescription", ""),
        )
