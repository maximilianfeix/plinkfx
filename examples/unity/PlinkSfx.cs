// plinkfx sound player for Unity. Put the exported WAVs under Assets/Resources/Sfx:
//   npx plinkfx export Assets/Resources/Sfx --variants
// Import settings for short effects: Load Type = Decompress On Load. Leave Force To Mono off: the files are mono already and it can re-normalise them.
// Usage: PlinkSfx.Play("coin");
using System.Collections.Generic;
using UnityEngine;

public class PlinkSfx : MonoBehaviour
{
    static PlinkSfx instance;
    readonly Dictionary<string, List<AudioClip>> takes = new Dictionary<string, List<AudioClip>>();
    readonly Dictionary<string, int> last = new Dictionary<string, int>();
    AudioSource source;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (instance != null) return;
        var go = new GameObject("PlinkSfx");
        DontDestroyOnLoad(go);
        instance = go.AddComponent<PlinkSfx>();
    }

    void Awake()
    {
        source = gameObject.AddComponent<AudioSource>();
        source.playOnAwake = false;
        foreach (var clip in Resources.LoadAll<AudioClip>("Sfx"))
        {
            // "coin-2" -> "coin"; names without a take number stay as they are.
            var name = clip.name;
            var dash = name.LastIndexOf('-');
            if (dash > 0 && int.TryParse(name.Substring(dash + 1), out _)) name = name.Substring(0, dash);
            if (!takes.TryGetValue(name, out var list)) takes[name] = list = new List<AudioClip>();
            list.Add(clip);
        }
    }

    /// Play a sound by name: a random take, never the same one twice in a row.
    public static void Play(string name, float volume = 1f)
    {
        if (instance == null) Boot();
        if (!instance.takes.TryGetValue(name, out var list) || list.Count == 0)
        {
            Debug.LogWarning($"plinkfx: no sound called '{name}'");
            return;
        }
        var i = Random.Range(0, list.Count);
        if (list.Count > 1 && instance.last.TryGetValue(name, out var prev) && prev == i) i = (i + 1) % list.Count;
        instance.last[name] = i;
        instance.source.PlayOneShot(list[i], volume);
    }
}
