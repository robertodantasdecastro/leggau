using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Leggau.UI
{
    public class TextValueView : MonoBehaviour
    {
        [SerializeField] private TMP_Text tmpText;
        [SerializeField] private Text legacyText;

        public void BindLegacyText(Text value)
        {
            legacyText = value;
        }

        public void BindTmpText(TMP_Text value)
        {
            tmpText = value;
        }

        public void SetText(string value)
        {
            if (tmpText != null)
            {
                tmpText.text = value;
            }

            if (legacyText != null)
            {
                legacyText.text = value;
            }
        }

        private void Reset()
        {
            tmpText = GetComponent<TMP_Text>();
            legacyText = GetComponent<Text>();
        }
    }
}
