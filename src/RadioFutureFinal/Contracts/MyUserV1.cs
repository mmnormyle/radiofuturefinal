﻿using Newtonsoft.Json;

namespace RadioFutureFinal.Contracts
{
    public class MyUserV1
    {
        public MyUserV1()
        {
            // TODO: this is wacky
            State = new UserStateV1();
        }

        [JsonProperty]
        public int Id { get; set; }

        [JsonProperty]
        public string Name { get; set; }

        [JsonProperty] 
        public UserStateV1 State { get; set; }

        [JsonProperty] 
        public bool Temporary { get; set; }
    }
}
